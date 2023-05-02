import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType, getEthersProvider, LogDescription } from "forta-agent";
import { BigNumber, utils, ethers } from "ethers";
import { PoolFetcher } from "./utils";
// This is the address of the token and the events in the liquidity contract we're monitoring
const { SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, SWAP_FACTORY_ABI, ADDLIQUIDITY_EVENT_ABI, BURN_EVENT_ABI, } = require("./constants");

// const THRESHOLD_PERCENTAGE = require("./utils")
const THRESHOLD_PERCENTAGE: BigNumber = BigNumber.from(90);


// Swap Factory V3 interface with the event
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddresses: Record<string, string>, thresholdPercentage: BigNumber): HandleTransaction => {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        // Initialize the finding array
        let findings: Finding[] = [];
        let fetcher = new PoolFetcher(getEthersProvider());
        const logs: LogDescription[] = txEvent.filterLog(BURN_EVENT_ABI);

        // Get all PairCreated and AddLiquidity events for each EVM
        for (const [evmName, swapFactoryAddress] of Object.entries(swapFactoryAddresses)) {
            // Check if creator of pool or pair removes 90% of liquidity
            if (!logs) return findings;
            await Promise.all(
                logs.map(async (log) => {
                    const block = txEvent.blockNumber;
                    const [valid, token0, token1, totalSupply] = await fetcher.getPoolData(block, log.address);
                    let transaction = txEvent.transaction;
                    const creatorAddress = transaction.from;
                    const provider = getEthersProvider();
               if (valid && totalSupply.gt(0)) {
                        // const tokenSymbol = await fetcher.getTokenSymbol(block - 1, tokenAddress!); // Get token symbol using custom function
                        try {
                            const [balance0, balance1] = await fetcher.getPoolBalance(block - 1, log.address, token0, token1);
                            const factoryInterface = new ethers.Contract(
                                swapFactoryAddress,
                                SWAP_FACTORY_ABI,
                                provider
                              );
                              const pairAddress = await factoryInterface.getPair(token0, token1);     
                            let tokenSymbol: string | null;
                            let address: string | null;
                            if (("token0" && "token1" in log.args) && balance0.lt(balance1)) {
                                const tokena = await fetcher.getTokenSymbol(block - 1, token1);
                                const tokenb = await fetcher.getTokenSymbol(block - 1, token0);
                                if (tokena === "WBNB" || tokena === "WETH" || tokena === "USDT") {
                                    tokenSymbol = `${tokenb} - ${tokena}`;
                                    address = `${token0}`
                                } else {
                                    tokenSymbol = `${tokena} - ${tokenb}`;
                                    address = `${token1}`
                                }
                            } else {
                                const tokena = await fetcher.getTokenSymbol(block - 1, token0);
                                const tokenb = await fetcher.getTokenSymbol(block - 1, token1);
                                if (tokena === "WBNB" || tokena === "WETH" || tokena === "USDT") {
                                    tokenSymbol = `${tokenb} - ${tokena}`;
                                    address = `${token1}`
                                } else {
                                    tokenSymbol = `${tokena} - ${tokenb}`;
                                    address = `${token0}`
                                }
                            }      
                            const amount0: BigNumber = BigNumber.from(log.args.amount0);
                            const amount1: BigNumber = BigNumber.from(log.args.amount1);
                            const percentageToken0Out = balance0.isZero() ? BigNumber.from(0) : amount0.mul(100).div(balance0);
                            const percentageToken1Out = balance1.isZero() ? BigNumber.from(0) : amount1.mul(100).div(balance1);
                            const createdPair = log.address.toLowerCase();
                            if ((percentageToken0Out.gte(thresholdPercentage) || percentageToken1Out.gte(thresholdPercentage))
                            ) {
                                if (valid) {

                                findings.push(Finding.fromObject({
                            name: "Liquidity Pool Removed",
                            description: `90% of the liquidity pool has been removed`,
                            alertId: alertId,
                            severity: FindingSeverity.High,
                            type: FindingType.Exploit,
                        labels: [
                            {
                                entityType: EntityType.Address,
                                entity: creatorAddress,
                                label: "attacker",
                                confidence: 0.9,
                                remove: false,

                            },
                            {
                                entityType: EntityType.Transaction,
                                entity: createdPair,
                                label: "soft-rug-pull-address",
                                confidence: 0.9,
                                remove: false,
                            },
                        ],
                        metadata: {
                            tokenSymbol: JSON.stringify(tokenSymbol!),
                            attackerAddress: JSON.stringify(creatorAddress),
                            transaction: JSON.stringify(transaction.hash),
                            tokenAddress: JSON.stringify(address!),
                            contractAddress: JSON.stringify(pairAddress!), 
                            event: JSON.stringify(log.name),
                            deployer: JSON.stringify(transaction.from!),
                        },
                    }));
                    }}
                        } catch (error: any) {
                        }
                    }
                })
            );
        }

        // Return the finding array
        return findings;
    };
};

export default {
    handleTransaction: provideHandleTransaction("SOFT-RUG-PULL-SUS-POOL-REMOVAL", SWAP_FACTORY_ADDRESSES, THRESHOLD_PERCENTAGE),
};
