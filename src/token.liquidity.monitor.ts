import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent, EntityType } from "forta-agent";
import { BigNumber, utils } from "ethers";

// This is the address of the token and the events in the liquidity contract we're monitoring
const { TOKEN_ADDRESS, SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, NEWPOOL_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI } = require("./constants");


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
            const addLiquidityEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, trackedTokenAddress);
            let tokenAddress: string | undefined;
            if (pairCreatedEvents.length > 0) {
                tokenAddress = pairCreatedEvents[0].args.token0.toLowerCase() || poolCreatedEvents[0].args.token0.toLowerCase() || newPoolEvents[0].args.token0.toLowerCase();
            }

            // Check if creator of pool or pair removes liquidity
            for (const event of poolCreatedEvents || pairCreatedEvents) {
                const poolAddress = event.args.pool;
                const pairAddress = event.args.pair;
                const poolEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, poolAddress);
                const pairEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, pairAddress);

                if (poolEvents.length > 0 || pairEvents.length > 0) {
                    findings.push(
                        Finding.fromObject({
                            name: "Suspicious Activity By Liquidity Pool Creator",
                            description: `Liquidity pool created by ${event.address} and then removed liquidity`,
                            alertId: alertId,
                            severity: FindingSeverity.High,
                            type: FindingType.Exploit,
                            labels: [
                                {
                                    entityType: EntityType.Address,
                                    entity: event.address,
                                    label: "attacker",
                                    confidence: 0.9,
                                    remove: false,
                                },
                                {
                                    entityType: EntityType.Transaction,
                                    entity: poolAddress || pairAddress,
                                    label: "soft-rug-pull-address",
                                    confidence: 0.9,
                                    remove: false,
                                },
                            ],
                        })
                    );
                }
            }
            // Check to see if the creator takes large amount of token and sell on the token liquidity pool
            const tokenCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI || POOLCREATED_EVENT_ABI);
            for (const event of tokenCreatedEvents) {
                const tokenAddress = event.args.token;
                const addLiquidityEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, tokenAddress);

                for (const addLiquidityEvent of addLiquidityEvents) {
                    if (addLiquidityEvent.args.amount0.gt(BigNumber.from(1000000000000000000000)) || addLiquidityEvent.args.amount1.gt(BigNumber.from(1000000000000000000000))) {
                        findings.push(
                            Finding.fromObject({
                                name: "Potentially Rug Pull Activity Liquidity Pool Creator",
                                description: `Token ${tokenAddress} was created and large amount of tokens were sold on the liquidity pool`,
                                alertId: alertId,
                                severity: FindingSeverity.High,
                                type: FindingType.Exploit,
                                labels: [
                                    {
                                        entityType: EntityType.Address,
                                        entity: event.address,
                                        label: "attacker",
                                        confidence: 0.9,
                                        remove: false,
                                    },
                                ],
                            })
                        );
                    }
                }
            }

        }

        // Return the finding array
        return findings;
    };
};

export default {
    handleTransaction: provideHandleTransaction("RUG-3", SWAP_FACTORY_ADDRESSES, TOKEN_ADDRESS),
};

