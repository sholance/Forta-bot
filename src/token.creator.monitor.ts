import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType, getEthersProvider } from "forta-agent";
import { utils } from "ethers";
import { PoolFetcher } from "./utils";

// This is the address of the token and the events in the liquidity contract we're monitoring
const { SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, MIN_NONCE_THRESHOLD, TRANSFER_EVENT_ABI, APPROVAL_EVENT_ABI, MINT_EVENT_ABI, BURN_EVENT_ABI } = require("./constants");


// Swap Factory V3 interface with the event
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddresses: Record<string, string>): HandleTransaction => {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        // Initialize the finding array
        let findings: Finding[] = [];
        let fetcher = new PoolFetcher(getEthersProvider());
        const block = txEvent.blockNumber;
      


        // Get all PairCreated and AddLiquidity events for each EVM
        for (const [evmName, swapFactoryAddress] of Object.entries(swapFactoryAddresses)) {
            const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);
            const poolCreatedEvents = txEvent.filterLog(POOLCREATED_EVENT_ABI, swapFactoryAddress);
            const newPoolEvents = txEvent.filterLog(NEWPOOL_EVENT_ABI, swapFactoryAddress);
            let transaction = txEvent.transaction;

            try {
                for (const event of [...poolCreatedEvents, ...pairCreatedEvents, ...newPoolEvents]) {
                    let tokenAddress: string | undefined;
                    if ("token0" in event.args) {
                        tokenAddress = event.args.token0.toLowerCase();
                    }
                    const creatorAddress = txEvent.from.toLowerCase();

                    if (creatorAddress) {
                    const nonce = txEvent.transaction.nonce;
                    const code = await getEthersProvider().getCode(creatorAddress!);
                    const isEoa = (code === '0x');
                          
                    if (isEoa && nonce <= MIN_NONCE_THRESHOLD) {
                        const tokenSymbol = await fetcher.getTokenSymbol(block - 1, tokenAddress!); // Get token symbol using custom function
                        findings.push(
                            Finding.fromObject({
                                    name: 'Potentially Suspicious Creator',
                                    description: `Pool created by creator with ${nonce} transactions`,
                                    alertId: alertId,
                                    severity: FindingSeverity.Info,
                                    type: FindingType.Suspicious,
                                    labels: [
                                        {
                                            entityType: EntityType.Address,
                                            entity: creatorAddress!,
                                            label: 'creator',
                                            confidence: 0.6,
                                            remove: false,
                                        },
                                    ],
                                    metadata: {
                                        tokenSymbol: JSON.stringify(tokenSymbol),
                                        attackerAddress: JSON.stringify(creatorAddress),
                                        transaction: JSON.stringify(transaction.hash),
                                        tokenAddress: tokenAddress!,
                                        nonce: JSON.stringify(nonce),
                                        contractAddress: JSON.stringify(event.address.toLowerCase()),
                                        event: JSON.stringify(event.name),
                                        deployer: JSON.stringify(transaction.from),
                                    },
                                })
                            );
                    }
                }
                }
            }
            catch (error) {
                console.log(error)
            }


        }

        // Return the finding array
        return findings;
    };
};

export default {
    handleTransaction: provideHandleTransaction("SOFT-RUG-PULL-SUS-LIQ-POOL-CREATION", SWAP_FACTORY_ADDRESSES),
};
