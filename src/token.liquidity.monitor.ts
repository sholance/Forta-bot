import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { BigNumber, utils } from "ethers";


const { TOKEN_ADDRESS } = require("./constants");

// The addresses of the Swap v3 Factories for the 7 EVMS
const SWAP_FACTORY_ADDRESSES: Record<string, string> = {
  ethereum: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  avalanche: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
  bsc: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  polygon: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
  fantom: "0x514053a5bAa4CfEf80Aa7c2a55d2C8365A5B5EAd",
  arbitrum: "0x84fBa05A20F09a556eBAbf745d9e5DF5D794A038",
  optimism: "0xCf73231F28B7331BBe3124B907840A94851f9f11"
};

// The signature of the PoolCreated event
const POOLCREATED_EVENT_ABI: string = "event PoolCreated(address indexed token0, address indexed token1, address pool, uint24 fee, int24 tickSpacing)";
// The signature of the PairCreated event
const PAIRCREATED_EVENT_ABI: string = "event PairCreated(address indexed token0, address indexed token1, address pair, uint)";
// The signature of the Mint event (adding liquidity to a pool)
const ADDLIQUIDITY_EVENT_ABI: string = "event Mint(address indexed sender, uint256 amount0, uint256 amount1)";
// The signature of the Burn event (removing liquidity from a pool)
const BURN_EVENT_ABI: string = "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)";

// Swap Factory V3 interface with the events
export const SWAP_FACTORY_IFACE: utils.Interface = new utils.Interface([POOLCREATED_EVENT_ABI, PAIRCREATED_EVENT_ABI, ADDLIQUIDITY_EVENT_ABI, BURN_EVENT_ABI]);

// Returns a list of findings (may be empty if no relevant events)
export const provideHandleTransaction = (alertId: string, swapFactoryAddress: string, trackedTokenAddress: string): HandleTransaction => {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    // Initialize the finding array
    let findings: Finding[] = [];

    // Get all relevant events
    const poolCreatedEvents = txEvent.filterLog(POOLCREATED_EVENT_ABI, swapFactoryAddress);
    const pairCreatedEvents = txEvent.filterLog(PAIRCREATED_EVENT_ABI, swapFactoryAddress);
    const addLiquidityEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, trackedTokenAddress);
    const burnEvents = txEvent.filterLog(BURN_EVENT_ABI, trackedTokenAddress);

    // Check if creator  of pool removes liquidity
    for (const event of poolCreatedEvents) {
      const poolAddress = event.args.pool;
      const poolEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, poolAddress);
      if (poolEvents.length > 0) {
        findings.push(
          Finding.fromObject({
            name: "Potentially Suspicious Liquidity Pool Creator",
            description: `Liquidity pool created by ${event.address} and then removed liquidity`,
            alertId: alertId,
            severity: FindingSeverity.Info,
            type: FindingType.Suspicious,
            metadata: {
              creator: event.address,
              poolAddress: poolAddress,
            },
          })
        );
      }
    }
    // Check if creator of pair removes liquidity
    for (const event of pairCreatedEvents) {
      const pairAddress = event.args.pair;
      const pairEvents = txEvent.filterLog(ADDLIQUIDITY_EVENT_ABI, pairAddress);
      if (pairEvents.length > 0) {
        findings.push(
          Finding.fromObject({
            name: "Potentially Suspicious Liquidity Pool Creator",
            description: `Liquidity pool created by ${event.address} and then removed liquidity`,
            alertId: alertId,
            severity: FindingSeverity.Info,
            type: FindingType.Suspicious,
            metadata: {
              creator: event.address,
              pairAddress: pairAddress,
            },
          })
        );
      }
    }

    // check if creator takes large amount of token and sell on the token liquidity pool
    for (const event of addLiquidityEvents) {
      if (event.args.amount0.gt(BigNumber.from(1000000000000000000000)) || event.args.amount1.gt(BigNumber.from(1000000000000000000000))) {
        findings.push(
          Finding.fromObject({
            name: "Potentially Suspicious Liquidity Pool Creator",
            description: `Liquidity pool created by ${event.address} and then removed liquidity`,
            alertId: alertId,
            severity: FindingSeverity.Info,
            type: FindingType.Suspicious,
            metadata: {
              creator: event.address,
              amount0: event.args.amount0.toString(),
              amount1: event.args.amount1.toString(),
            },
          })
        );
      }
    }

    // Return the finding array
    return findings;

  };
};

// The agent function
export default function provideTokenLiquidityMonitorAgent(
  alertId: string,
  swapFactoryAddress: string,
  trackedTokenAddress: string
): HandleTransaction {
  return provideHandleTransaction(alertId, swapFactoryAddress, trackedTokenAddress);
}


