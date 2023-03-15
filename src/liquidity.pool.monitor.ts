import { Finding, HandleTransaction, FindingSeverity, FindingType, TransactionEvent } from "forta-agent";
import { utils } from "ethers";

// The address of the token we're monitoring
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

// The signature of the PairCreated event
const PAIRCREATED_EVENT_ABI: string = "event PairCreated(address indexed token0, address indexed token1, address pair, uint)";
const POOLCREATED_EVENT_ABI: string = "event PoolCreated(address indexed token0, address indexed token1, uint24 fee, address pool, uint256)";
const NEWPOOL_EVENT_ABI: string = "event NewPool(address indexed token0, address indexed token1, uint24 fee, address pool, uint256)";
const ADDLIQUIDITY_EVENT_ABI: string = "event Mint(address indexed sender, uint256 amount0, uint256 amount1)";

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

      // Check if no one else deposits liquidity for the current EVM
      if (addLiquidityEvents.length === 0 && (pairCreatedEvents.length > 0 || poolCreatedEvents.length > 0 || newPoolEvents.length > 0)) {
        findings.push(
          Finding.fromObject({
            name: `No Liquidity Deposits on ${evmName}`,
            description: `No one has deposited liquidity into the pool for the tracked token on ${evmName}`,
            alertId: alertId,
            severity: FindingSeverity.High,
            type: FindingType.Suspicious,
            metadata: {
              trackedToken: trackedTokenAddress,
              pair: pairCreatedEvents[0].args.pair.toLowerCase(),
            },
          })
        );
      }
    }

    // Return the finding array
    return findings;
  };
};

export default {
  handleTransaction: provideHandleTransaction("SHOLA-1", SWAP_FACTORY_ADDRESSES, TOKEN_ADDRESS),
};

