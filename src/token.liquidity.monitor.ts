import {
    Finding,
    HandleTransaction,
    FindingSeverity,
    FindingType,
    getEthersProvider,
    TransactionEvent,
    EntityType
} from "forta-agent";
import { BigNumber, utils } from "ethers";

const ethersProvider = getEthersProvider();


const { SWAP_FACTORY_ADDRESSES, POOLCREATED_EVENT_ABI, PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, BURN_EVENT_ABI } = require("./constants");

// Swap Factory V3 interface with the events
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([POOLCREATED_EVENT_ABI, PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, BURN_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddresses: Record<string, string>): HandleTransaction => {
    return async (txEvent: TransactionEvent): Promise<Finding[]> => {
        // Initialize the finding array
        let findings: Finding[] = [];

        // Get all relevant events
        for (const [evmName, swapFactoryAddress] of Object.entries(swapFactoryAddresses)) {
            const poolCreatedEvents = txEvent.filterLog(POOLCREATED_EVENT_ABI, swapFactoryAddress);
            const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);

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
        };
        // Return the finding array
        return findings;

    };
};



// agent function
export default {
    handleTransaction: provideHandleTransaction("RUG-3", SWAP_FACTORY_ADDRESSES)
}