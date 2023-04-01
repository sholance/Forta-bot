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
        try {
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
                const creatorAddress: string = event.args.creator.toLowerCase();
                const creatorTransactions = txEvent.filterLog(allEvents, tokenAddress)
                if (creatorTransactions.length < MIN_TRANSACTIONS) {
                    findings.push(
                        Finding.fromObject({
                                name: 'Potentially Suspicious Creator',
                                description: `Pool created by creator with only ${creatorTransactions.length} transactions`,
                                alertId: alertId,
                                severity: FindingSeverity.Info,
                                type: FindingType.Suspicious,
                            protocol: `${evmName}`,
                                labels: [
                                    {
                                        entityType: EntityType.Address,
                                        entity: creatorAddress,
                                        label: 'attacker',
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
        } catch (error) {
            console.log(error);
            return [];
    };
    }
};

export default {
    handleTransaction: provideHandleTransaction("SOFT-RUG-PULL-SUS-LIQ-POOL-CREATION", SWAP_FACTORY_ADDRESSES),
};
