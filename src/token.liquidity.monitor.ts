import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType, LogDescription, getEthersProvider } from "forta-agent";
import { BigNumber, utils } from "ethers";
import { PoolFetcher, THRESHOLD_PERCENTAGE } from "./utils";

// This is the address of the token and the events in the liquidity contract we're monitoring
const { SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, REMOVELIQUIDITY_EVENT_ABI, BURN_EVENT_ABI } = require("./constants");


// Swap Factory V3 interface with the event
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddresses: Record<string, string>, fetcher: PoolFetcher, thresholdPercentage: BigNumber
): HandleTransaction => {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        // Initialize the finding array
        let findings: Finding[] = [];
        const logs: LogDescription[] = txEvent.filterLog(BURN_EVENT_ABI);

        // Get all PairCreated and AddLiquidity events for each EVM
        for (const [evmName, swapFactoryAddress] of Object.entries(swapFactoryAddresses)) {
            const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);
            const poolCreatedEvents = txEvent.filterLog(POOLCREATED_EVENT_ABI, swapFactoryAddress);
            const newPoolEvents = txEvent.filterLog(NEWPOOL_EVENT_ABI, swapFactoryAddress);
            const removeLiquidityEvent = txEvent.filterLog(REMOVELIQUIDITY_EVENT_ABI);

            // Check if creator of pool or pair removes liquidity
            for (const event of [...poolCreatedEvents, ...pairCreatedEvents, ...newPoolEvents]) {
                let tokenAddress;
                if ("token0" in event.args) {
                    tokenAddress = event.args.token0.toLowerCase();
                }
                let creatorAddress;
                if (event.args && event.args.sender) {
                    creatorAddress = event.args.sender.toLowerCase();
                }

                if (removeLiquidityEvent.length === 0 && (pairCreatedEvents.length > 0 || poolCreatedEvents.length > 0 || newPoolEvents.length > 0)) {
                        findings.push(
                            Finding.fromObject({
                                name: "Suspicious Activity in Liquidity Pool",
                                description: `Liquidity pool created by ${creatorAddress} and then liquidity removed`,
                                alertId: alertId,
                                severity: FindingSeverity.High,
                                type: FindingType.Exploit,
                                protocol: `${evmName}`,
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
                                        entity: tokenAddress,
                                        label: "soft-rug-pull-address",
                                        confidence: 0.9,
                                        remove: false,
                                    },
                                ],
                            })
                        )
                }

            }
            // // TODO FUNCTION TO check if creator takes large amount of token and sell on the token liquidity pool
            if (!logs) return findings;
            await Promise.all(
                logs.map(async (log) => {
                    const block = txEvent.blockNumber;
                    const [valid, token0, token1, totalSupply] = await fetcher.getPoolData(block - 1, log.address);
                    let tokenAddress;
                    if ("token0" in log.args) {
                        tokenAddress = log.args.token0.toLowerCase();
                    }
                    let creatorAddress;
                    if (log.args && log.args.sender) {
                        creatorAddress = log.args.sender.toLowerCase();
                    }

                    // const createdPair = createPair(token0, token1, swapFactoryAddress);
                    if (valid) {
                        const [balance0, balance1] = await fetcher.getPoolBalance(block - 1, log.address, token0, token1);
                        const amount0: BigNumber = BigNumber.from(log.args.amount0);
                        const amount1: BigNumber = BigNumber.from(log.args.amount1);
                        const percentageToken0Out = amount0.mul(100).div(balance0);
                        const percentageToken1Out = amount1.mul(100).div(balance1);
                        const createdPair = log.address.toLowerCase();
                        const creatorAddress: string = log.args.sender.toLowerCase();
                        if ((percentageToken0Out.gte(thresholdPercentage) || percentageToken1Out.gte(thresholdPercentage))
                        ) {
                            findings.push(Finding.fromObject({
                                name: "Liquidity Pool Removed",
                                description: `90% of the liquidity pool has been removed`,
                                alertId: alertId,
                                severity: FindingSeverity.High,
                                type: FindingType.Exploit,
                                protocol: `${evmName}`,
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
                            }));
                        }
                    }
                })
            ).catch((error) => {
                console.log(error)
            })
        }

        // Return the finding array
        return findings;
    };
};

export default {
    handleTransaction: provideHandleTransaction("SOFT-RUG-PULL-SUS-POOL-REMOVAL", SWAP_FACTORY_ADDRESSES, new PoolFetcher(getEthersProvider()),
        THRESHOLD_PERCENTAGE),
};

