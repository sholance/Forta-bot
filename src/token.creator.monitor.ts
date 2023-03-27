import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType, getTransactionReceipt } from "forta-agent";
import { utils } from "ethers";

// This is the address of the token and the events in the liquidity contract we're monitoring
const { SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, MIN_TRANSACTIONS, TRANSFER_EVENT_ABI, APPROVAL_EVENT_ABI, MINT_EVENT_ABI, BURN_EVENT_ABI } = require("./constants");


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
            const allEvents = [TRANSFER_EVENT_ABI, APPROVAL_EVENT_ABI, MINT_EVENT_ABI, BURN_EVENT_ABI];



            for (const event of [...poolCreatedEvents, ...pairCreatedEvents, ...newPoolEvents]) {
                let tokenAddress: string | undefined;
                if ("token0" in event.args) {
                    tokenAddress = event.args.token0.toLowerCase();
                }
                let creatorAddress: string | undefined;
                if (event.args && event.args.sender) {
                    creatorAddress = event.args.sender.toLowerCase();
                }
                const creatorTransactions = txEvent.filterLog(allEvents, tokenAddress)
                if (creatorTransactions.length < MIN_TRANSACTIONS) {
                    findings.push(
                        Finding.fromObject({
                                name: 'Potentially Suspicious Creator',
                                description: `Pool created by creator with only ${creatorTransactions.length} transactions`,
                                alertId: alertId,
                                severity: FindingSeverity.Info,
                                type: FindingType.Suspicious,
                                labels: [
                                    {
                                        entityType: EntityType.Address,
                                        entity: creatorAddress || "",
                                        label: 'creator',
                                        confidence: 0.6,
                                        remove: false,
                                    },
                                ],
                            })
                        );
                }
            }

        }

        // Return the finding array
        return findings;
    };
};

export default {
    handleTransaction: provideHandleTransaction("RUG-1", SWAP_FACTORY_ADDRESSES),
};
