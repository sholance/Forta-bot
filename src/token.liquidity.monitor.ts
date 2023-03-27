import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType } from "forta-agent";
import { BigNumber, utils } from "ethers";
import { createAddress } from "forta-agent-tools";

// This is the address of the token and the events in the liquidity contract we're monitoring
const { TOKEN_ADDRESS, SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, REMOVELIQUIDITYIMBALANCE_EVENT_ABI, REMOVELIQUIDITY_EVENT_ABI, BURN_EVENT_ABI, TRANSFER_EVENT_ABI } = require("./constants");


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
            const burnEvent = txEvent.filterLog(BURN_EVENT_ABI, trackedTokenAddress);
            const mintEvent = txEvent.filterLog(TRANSFER_EVENT_ABI, trackedTokenAddress);

            // Check if creator of pool or pair removes liquidity
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
                    findings.push(
                        Finding.fromObject({
                            name: "Suspicious Activity By Liquidity Pool Creator",
                            description: `Liquidity pool created by ${creatorAddress} and then removed liquidity on ${evmName}`,
                            alertId: alertId,
                            severity: FindingSeverity.High,
                            type: FindingType.Exploit,
                            labels: [
                                {
                                    entityType: EntityType.Address,
                                    entity: creatorAddress || '',
                                    label: "attacker",
                                    confidence: 0.9,
                                    remove: false,
                                },
                                {
                                    entityType: EntityType.Transaction,
                                    entity: tokenAddress || '',
                                    label: "soft-rug-pull-address",
                                    confidence: 0.9,
                                    remove: false,
                                },
                            ],
                        })
                    );
                }
            }
            // TODO FUNCTION TO check if creator takes large amount of token and sell on the token liquidity pool

        }

        // Return the finding array
        return findings;
    };
};

export default {
    handleTransaction: provideHandleTransaction("RUG-3", SWAP_FACTORY_ADDRESSES, TOKEN_ADDRESS),
};

