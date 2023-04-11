import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType, getEthersProvider, LogDescription } from "forta-agent";
import { BigNumber, utils } from "ethers";
import { PoolFetcher } from "./utils";
// This is the address of the token and the events in the liquidity contract we're monitoring
const { TOKEN_ADDRESS, SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, BURN_EVENT_ABI, } = require("./constants");

// const THRESHOLD_PERCENTAGE = require("./utils")
const THRESHOLD_PERCENTAGE: BigNumber = BigNumber.from(90);


// Swap Factory V3 interface with the event
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddresses: Record<string, string>, trackedTokenAddress: string, thresholdPercentage: BigNumber): HandleTransaction => {
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
                    const [valid, token0, token1, totalSupply] = await fetcher.getPoolData(block - 1, log.address);
                    let transaction = txEvent.transaction;
                    const creatorAddress = transaction.from;
                    let tokenAddress: string;
                    if ("token0" in log.args) {
                        tokenAddress = log.args.token0.toLowerCase();
                    }

                    if (valid && totalSupply.gt(0)) {
                        const tokenSymbol = await fetcher.getTokenSymbol(block - 1, log.address); // Get token symbol using custom function
                        try {
                            const [balance0, balance1] = await fetcher.getPoolBalance(block - 1, log.address, token0, token1);
                            const amount0: BigNumber = BigNumber.from(log.args.amount0);
                            const amount1: BigNumber = BigNumber.from(log.args.amount1);
                            const percentageToken0Out = amount0.mul(100).div(balance0);
                            const percentageToken1Out = amount1.mul(100).div(balance1);
                            const createdPair = log.address.toLowerCase();
                            // const creatorAddress: string = log.args.sender.toLowerCase();
                            if ((percentageToken0Out.gte(thresholdPercentage) || percentageToken1Out.gte(thresholdPercentage))
                            ) {

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
                            tokenSymbol: JSON.stringify(tokenSymbol),
                            attackerAddress: JSON.stringify(creatorAddress),
                            transaction: JSON.stringify(transaction.hash),
                            tokenAddress: tokenAddress!,
                            contractAddress: JSON.stringify(transaction.to),
                            event: JSON.stringify(log.name),
                            deployer: JSON.stringify(log.args.sender),
                        },
                    }));
                    }
                        } catch (error) {
                            console.log(error)
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
    handleTransaction: provideHandleTransaction("SOFT-RUG-PULL-SUS-POOL-REMOVAL", SWAP_FACTORY_ADDRESSES, TOKEN_ADDRESS, THRESHOLD_PERCENTAGE),
};

