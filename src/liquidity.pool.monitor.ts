import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { utils } from "ethers";

// The address of the token we're monitoring
const { TOKEN_ADDRESS, SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI } = require("./constants");


// Swap Factory V3 interface with the event
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddresses: Record<string, string>, trackedTokenAddress: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    // Initialize the finding array
    let findings: Finding[] = [];

    // Get all PairCreated and AddLiquidity events for each EVM
    for (const [evmName, swapFactoryAddress] of Object.entries(swapFactoryAddresses)) {
      const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);
      const poolCreatedEvents = txEvent.filterLog(POOLCREATED_EVENT_ABI, swapFactoryAddress);
      const newPoolEvents = txEvent.filterLog(NEWPOOL_EVENT_ABI, swapFactoryAddress);
      const addLiquidityEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, trackedTokenAddress);

      // Check if no one else deposits liquidity for the current EVM
      if (addLiquidityEvents.length === 0 && (pairCreatedEvents.length > 0 || poolCreatedEvents.length > 0 || newPoolEvents.length > 0)) {
        findings.push(
          Finding.fromObject({
            name: `No Liquidity Deposits on ${evmName}`,
            description: `No one has deposited liquidity into the pool for the tracked token on ${evmName}`,
            alertId: alertId,
            severity: FindingSeverity.High,
            type: FindingType.Suspicious,
            metadata: {
              trackedToken: trackedTokenAddress,
              pair: pairCreatedEvents[0].args.pair.toLowerCase(),
            },
          })
        );
      }
    }

    // Return the finding array
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction("RUG-2", SWAP_FACTORY_ADDRESSES, TOKEN_ADDRESS),
};

