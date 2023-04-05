import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType, ethers, getEthersProvider, LogDescription } from "forta-agent";
import { BigNumber, utils } from "ethers";
import { PoolFetcher } from "./utils";
// This is the address of the token and the events in the liquidity contract we're monitoring
const { TOKEN_ADDRESS, SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, REMOVELIQUIDITY_EVENT_ABI, BURN_EVENT_ABI, } = require("./constants");

// const THRESHOLD_PERCENTAGE = require("./utils")


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
            const removeLiquidityEvent = txEvent.filterLog(REMOVELIQUIDITY_EVENT_ABI, trackedTokenAddress);

            for (const event of [...poolCreatedEvents, ...pairCreatedEvents, ...newPoolEvents]) {
                let tokenAddress: string | undefined;
                if ("token0" in event.args) {
                    tokenAddress = event.args.token0.toLowerCase();
                }
                let creatorAddress: string | undefined;
                if (event.args && event.args.sender) {
                    creatorAddress = event.args.sender.toLowerCase();
                }

                if (removeLiquidityEvent.length === 0 && (pairCreatedEvents.length > 0 || poolCreatedEvents.length > 0 || newPoolEvents.length > 0)) {
                    try {
                        findings.push(
                            Finding.fromObject({
                                name: "Suspicious Activity In Liquidity Pool",
                                description: `Liquidity pool likely removed by creator`,
                                alertId: alertId,
                                severity: FindingSeverity.Info,
                                type: FindingType.Exploit,
                                labels: [
                                    {
                                        entityType: EntityType.Address,
                                        entity: creatorAddress!,
                                        label: "attacker",
                                        confidence: 0.9,
                                        remove: false,
                                    },
                                    {
                                        entityType: EntityType.Transaction,
                                        entity: tokenAddress!,
                                        label: "soft-rug-pull-address",
                                        confidence: 0.9,
                                        remove: false,
                                    },
                                ],
                            })
                        );
                    } catch (error) {
                        console.log(error)
                    }
                }
            }

        }

        // Return the finding array
        return findings;
    };
};

export default {
    handleTransaction: provideHandleTransaction("SOFT-RUG-PULL-SUS-POOL-REMOVAL", SWAP_FACTORY_ADDRESSES, TOKEN_ADDRESS),
};

