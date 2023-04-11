import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType, getEthersProvider, LogDescription } from "forta-agent";
import { utils } from "ethers";
import { PoolFetcher } from "./utils";

// This is the address of the token and the events in the liquidity contract we're monitoring
const { TOKEN_ADDRESS, SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI } = require("./constants");


// Swap Factory V3 interface with the event
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddresses: Record<string, string>, trackedTokenAddress: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    // Initialize the finding array
    let findings: Finding[] = [];
    let fetcher = new PoolFetcher(getEthersProvider());
    const block = txEvent.blockNumber;

    // const log: LogDescription[] = txEvent.filterLog(PAIRCREATED_EVENT_ABI);

    // Get all PairCreated and AddLiquidity events for each EVM
    for (const [evmName, swapFactoryAddress] of Object.entries(swapFactoryAddresses)) {
      const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);
      const poolCreatedEvents = txEvent.filterLog(POOLCREATED_EVENT_ABI, swapFactoryAddress);
      const newPoolEvents = txEvent.filterLog(NEWPOOL_EVENT_ABI, swapFactoryAddress);
      const addLiquidityEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, trackedTokenAddress);
      let tokenAddress: string | undefined;
      if (pairCreatedEvents.length > 0) {
        tokenAddress = pairCreatedEvents[0].args.token0.toLowerCase() || poolCreatedEvents[0].args.token0.toLowerCase() || newPoolEvents[0].args.token0.toLowerCase();
      }
      let transaction = txEvent.transaction;
      // Checks to see if no one else deposits liquidity in the token's the liquidity pool
      if (addLiquidityEvents.length === 0 && (pairCreatedEvents.length > 0 || poolCreatedEvents.length > 0 || newPoolEvents.length > 0)) {
        const tokenSymbol = await fetcher.getTokenSymbol(block - 1, tokenAddress!); // Get token symbol using custom function
        findings.push(
          Finding.fromObject({
            name: `No Liquidity Deposits in ${tokenAddress}`,
            description: `No one has deposited liquidity into the pool for the tracked token on ${evmName}`,
            alertId: alertId,
            severity: FindingSeverity.Medium,
            type: FindingType.Suspicious,
            labels: [
              {
                entityType: EntityType.Address,
                entity: tokenAddress!,
                label: "token-address",
                confidence: 0.8,
                remove: false,
              },
              {
                entityType: EntityType.Transaction,
                entity: pairCreatedEvents[0].args.pair.toLowerCase(),
                label: "pair-monitored",
                confidence: 0.8,
                remove: false,
              }
            ],
            metadata: {
              tokenSymbol: JSON.stringify(tokenSymbol),
              attackerAddress: JSON.stringify(transaction.from),
              transaction: JSON.stringify(transaction.hash),
              tokenAddress: tokenAddress!,
              contractAddress: JSON.stringify(transaction.to),
              deployer: JSON.stringify(transaction.from),
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
  handleTransaction: provideHandleTransaction("SOFT-RUG-PULL-SUS-LIQ-POOL-RESERVE-CHANGE", SWAP_FACTORY_ADDRESSES, TOKEN_ADDRESS),
};

