const { provideHandleTransaction } = require("./agent");

describe("Soft Rug agent", () => {
  let handleTransaction: any;
  const mockSoftRugPullAgent = {
    handleTransaction: jest.fn(),
  };
  const mockTransferFromFunctionAgent = {
    handleTransaction: jest.fn(),
  };
  const mockTxEvent = {
    some: "event",
  };

  beforeAll(() => {
    handleTransaction = provideHandleTransaction(
      mockSoftRugPullAgent,
      mockTransferFromFunctionAgent
    );
  });

  
  it("invokes largeTransferEventAgent and transferFromFunctionAgent and returns their findings", async () => {
    const mockFinding = { some: "finding" };
    mockSoftRugPullAgent.handleTransaction.mockReturnValueOnce([
      mockFinding,
    ]);
    mockTransferFromFunctionAgent.handleTransaction.mockReturnValueOnce([
      mockFinding,
    ]);

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([mockFinding, mockFinding]);
    expect(mockSoftRugPullAgent.handleTransaction).toHaveBeenCalledTimes(
      1
    );
    expect(mockSoftRugPullAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent
    );
    expect(
      mockTransferFromFunctionAgent.handleTransaction
    ).toHaveBeenCalledTimes(1);
    expect(
      mockTransferFromFunctionAgent.handleTransaction
    ).toHaveBeenCalledWith(mockTxEvent);
  });
});