import {
  Finding,
  FindingSeverity,
  FindingType,
  HandleTransaction,
  createTransactionEvent,
} from "forta-agent";
import { ethers } from "ethers";

const { provideHandleTransaction } = require("./agent");

type Agent = {
  handleTransaction: HandleTransaction,
}
// mock agents to test against
const creatorMonitorFunctionAgent = {
  handleTransaction: jest.fn(),
};

const liquidityPoolMonitorFunctionAgent = {
  handleTransaction: jest.fn(),
};

const tokenLiquidityMonitorFunctionAgent = {
  handleTransaction: jest.fn(),
};

const tokenRemovalMonitorFunctionAgent = {
  handleTransaction: jest.fn(),
};

const mockTxEvent = createTransactionEvent({} as any);


const mockFinding: Finding = Finding.fromObject({
  name: "mock finding",
  description: "mock finding description",
  alertId: "mock alertId",
  severity: FindingSeverity.High,
  type: FindingType.Suspicious,
});

describe("provideHandleTransaction", () => {
  let handleTransaction: HandleTransaction;

  beforeEach(() => {
    jest.clearAllMocks();
    handleTransaction = provideHandleTransaction(
      creatorMonitorFunctionAgent,
      liquidityPoolMonitorFunctionAgent,
      tokenLiquidityMonitorFunctionAgent,
      tokenRemovalMonitorFunctionAgent
    );
  });

  it("returns empty findings if all agents return empty findings", async () => {
    creatorMonitorFunctionAgent.handleTransaction.mockResolvedValueOnce([]);
    liquidityPoolMonitorFunctionAgent.handleTransaction.mockResolvedValueOnce(
      []
    );
    tokenLiquidityMonitorFunctionAgent.handleTransaction.mockResolvedValueOnce(
      []
    );
    tokenRemovalMonitorFunctionAgent.handleTransaction.mockResolvedValueOnce(
      []
    );

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([]);
    expect(creatorMonitorFunctionAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent
    );
    expect(liquidityPoolMonitorFunctionAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent
    );
    expect(tokenLiquidityMonitorFunctionAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent
    );
    expect(tokenRemovalMonitorFunctionAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent
    );
  });

  it("returns a finding if any agent returns a finding", async () => {
    creatorMonitorFunctionAgent.handleTransaction.mockResolvedValueOnce([]);
    liquidityPoolMonitorFunctionAgent.handleTransaction.mockResolvedValueOnce(
      [mockFinding]
    );
    tokenLiquidityMonitorFunctionAgent.handleTransaction.mockResolvedValueOnce(
      []
    );
    tokenRemovalMonitorFunctionAgent.handleTransaction.mockResolvedValueOnce(
      []
    );

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([mockFinding]);
    expect(creatorMonitorFunctionAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent
    );
    expect(liquidityPoolMonitorFunctionAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent
    );
    expect(tokenLiquidityMonitorFunctionAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent
    );
    expect(tokenRemovalMonitorFunctionAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent
    );
  });

  it("returns empty findings if all agents throw an error", async () => {
    creatorMonitorFunctionAgent.handleTransaction.mockRejectedValueOnce(
      new Error("creatorMonitorFunctionAgent error")
    );
    liquidityPoolMonitorFunctionAgent.handleTransaction.mockRejectedValueOnce(
      new Error("liquidityPoolMonitorFunctionAgent error")
    );
    tokenLiquidityMonitorFunctionAgent.handleTransaction.mockRejectedValueOnce(
      new Error("tokenLiquidityMonitorFunctionAgent error")
  );
    })
})
