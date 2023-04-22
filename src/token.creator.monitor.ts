import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType, getEthersProvider, LogDescription } from "forta-agent";
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
      


        // Get all PairCreated and AddLiquidity events for each EVM
        for (const [evmName, swapFactoryAddress] of Object.entries(swapFactoryAddresses)) {
            const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);
            const poolCreatedEvents = txEvent.filterLog(POOLCREATED_EVENT_ABI, swapFactoryAddress);
            const newPoolEvents = txEvent.filterLog(NEWPOOL_EVENT_ABI, swapFactoryAddress);
            let transaction = txEvent.transaction;


            try {
                for (const event of [...poolCreatedEvents, ...pairCreatedEvents, ...newPoolEvents]) {
                    const creatorAddress = txEvent.from.toLowerCase();

                    if (creatorAddress) {
                    const nonce = txEvent.transaction.nonce;
                    const code = await getEthersProvider().getCode(creatorAddress!);
                    const isEoa = (code === '0x');
                          
                    if (isEoa && nonce <= MIN_NONCE_THRESHOLD) {
                        const  tokenAddress = pairCreatedEvents[0].args.token0.toLowerCase() || poolCreatedEvents[0].args.token0.toLowerCase() || newPoolEvents[0].args.token0.toLowerCase();
                        const block = txEvent.blockNumber;
                        const [valid, token0, token1, totalSupply] = await fetcher.getPoolData(block, event.args.pair);
                        const [balance0, balance1] = await fetcher.getPoolBalance(block - 1, event.args.pair, token0, token1);
                            let tokenSymbol: string | null;
                        if (("token0" && "token1" in event.args) && balance0.lt(balance1)) {
                            const tokena = await fetcher.getTokenSymbol(block - 1, token1);
                            const tokenb = await fetcher.getTokenSymbol(block - 1, token0);
                            tokenSymbol = `${tokena} - ${tokenb}`;
                          } else {
                              const tokena = await fetcher.getTokenSymbol(block - 1, token0);
                              const tokenb = await fetcher.getTokenSymbol(block - 1, token1);
                              tokenSymbol = `${tokena} - ${tokenb}`;
                          }
                                                   
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
                                        tokenSymbol: JSON.stringify(tokenSymbol!),
                                        attackerAddress: JSON.stringify(creatorAddress),
                                        transaction: JSON.stringify(transaction.hash),
                                        tokenAddress: tokenAddress,
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
            catch (error: any) {
            }


        }

        // Return the finding array
        return findings;
    };
};

export default {
    handleTransaction: provideHandleTransaction("SOFT-RUG-PULL-SUS-LIQ-POOL-CREATION", SWAP_FACTORY_ADDRESSES),
};
