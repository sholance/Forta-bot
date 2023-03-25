import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType } from "forta-agent";
import { utils } from "ethers";

// This is the address of the token and the events in the liquidity contract we're monitoring
const { SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI } = require("./constants");

// Swap Factory V3 interface with the event
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddresses: Record<string, string>): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    // Initialize the finding array
    let findings: Finding[] = [];

    // Get all PairCreated and AddLiquidity events for each EVM
    for (const [evmName, swapFactoryAddress] of Object.entries(swapFactoryAddresses)) {
      const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);
      const poolCreatedEvents = txEvent.filterLog(POOLCREATED_EVENT_ABI, swapFactoryAddress);
      const newPoolEvents = txEvent.filterLog(NEWPOOL_EVENT_ABI, swapFactoryAddress);
      const addLiquidityEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, undefined);

      // Checks to see if no one else deposits liquidity in the token's the liquidity pool
      if (addLiquidityEvents.length === 0 && (pairCreatedEvents.length > 0 || poolCreatedEvents.length > 0 || newPoolEvents.length > 0)) {
        const tokenAddresses: string[] = [];

        // Find all the token addresses
        pairCreatedEvents.forEach(event => {
          const tokenA = event.args.tokenA.toLowerCase();
          const tokenB = event.args.tokenB.toLowerCase();

          if (!tokenAddresses.includes(tokenA)) {
            tokenAddresses.push(tokenA);
          }
          if (!tokenAddresses.includes(tokenB)) {
            tokenAddresses.push(tokenB);
          }
        });

        // Create findings for each token address
        tokenAddresses.forEach(tokenAddress => {
          findings.push(
            Finding.fromObject({
              name: `No Liquidity Deposits on ${tokenAddress}`,
              description: `No one has deposited liquidity into the pool for token ${tokenAddress} on ${evmName}`,
              alertId: alertId,
              severity: FindingSeverity.Medium,
              type: FindingType.Suspicious,
              labels: [
                {
                  entityType: EntityType.Address,
                  entity: tokenAddress,
                  label: "token-address",
                  confidence: 0.8,
                  remove: false,
                },
                {
                  entityType: EntityType.Transaction,
                  entity: pairCreatedEvents[0]?.args?.pair?.toLowerCase() || "",
                  label: "pair-monitored",
                  confidence: 0.8,
                  remove: false,
                }
              ],
            })
          );
        });
      }
    }

    // Return the finding array
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction("RUG-2", SWAP_FACTORY_ADDRESSES),
};
