import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType, ethers } from "forta-agent";
import { Contract, BigNumber, providers, utils } from "ethers";
import { createAddress } from "forta-agent-tools";
import { FUNCTIONS_ABI } from "./constants";

// This is the address of the token and the events in the liquidity contract we're monitoring
const { TOKEN_ADDRESS, SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, REMOVELIQUIDITY_EVENT_ABI, BURN_EVENT_ABI, TRANSFER_EVENT_ABI, } = require("./constants");

const THRESHOLD_PERCENTAGE = require("./utils")


// Swap Factory V3 interface with the event
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddresses: Record<string, string>, trackedTokenAddress: string, thresholdPercentage: BigNumber): HandleTransaction => {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        // Initialize the finding array
        let findings: Finding[] = [];

        // Get all PairCreated and AddLiquidity events for each EVM
        for (const [evmName, swapFactoryAddress] of Object.entries(swapFactoryAddresses)) {
            const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);
            const poolCreatedEvents = txEvent.filterLog(POOLCREATED_EVENT_ABI, swapFactoryAddress);
            const newPoolEvents = txEvent.filterLog(NEWPOOL_EVENT_ABI, swapFactoryAddress);
            const removeLiquidityEvent = txEvent.filterLog(REMOVELIQUIDITY_EVENT_ABI, trackedTokenAddress);
            const burnEvent = txEvent.filterLog(BURN_EVENT_ABI);
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
                }
            }
            // TODO FUNCTION TO check if creator takes large amount of token and sell on the token liquidity pool
            for (const event of [...burnEvent]) {
                let token0: string | undefined;
                if ("token0" in event.args) {
                    token0 = event.args.token0.toLowerCase();
                }
                let token1: string | undefined;
                if ("token1" in event.args) {
                    token1 = event.args.token1.toLowerCase();
                }
                let totalSupply: string | undefined;
                if ("totalSupply" in event.args) {
                    totalSupply = event.args.totalSupply.toLowerCase();
                }
                if (token0 && token1) {
                    const token0Contract = new Contract(token0!, FUNCTIONS_ABI);
                    const token1Contract = new Contract(token1!, FUNCTIONS_ABI);
                    const balance0 = token0Contract.balanceOf(token0)
                    const balance1 = token1Contract.balanceOf(token1)
                    const amount0: BigNumber = BigNumber.from(event.args.amount0);
                    const amount1: BigNumber = BigNumber.from(event.args.amount1);
                    const percentageToken0Out = amount0.mul(100).div(balance0);
                    const percentageToken1Out = amount1.mul(100).div(balance1);
                    const createdPair = event.address.toLowerCase();
                    const creatorAddress: string = event.args.sender.toLowerCase();
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
                    }));
                    }
                }
            }
        }

        // Return the finding array
        return findings;
    };
};

export default {
    handleTransaction: provideHandleTransaction("SOFT-RUG-PULL-SUS-POOL-REMOVAL", SWAP_FACTORY_ADDRESSES, TOKEN_ADDRESS, THRESHOLD_PERCENTAGE),
};

