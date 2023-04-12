export const TOKEN_ADDRESS = "0xdbdc3f41e7baf3e5b014a3eb91b86f3570ead94c" //sample token address

// minimum number of transactions for a creator to be considered safe
export const MIN_NONCE_THRESHOLD = 3;


/****************** USEFUL EVENT ABI'S *******************************/
export const PAIRCREATED_EVENT_ABI: string = "event PairCreated(address indexed token0, address indexed token1, address pair, uint)";
export const POOLCREATED_EVENT_ABI: string = "event PoolCreated(address indexed token0, address indexed token1, uint24 fee, address pool, uint256)";
export const NEWPOOL_EVENT_ABI: string = "event NewPool(address indexed token0, address indexed token1, uint24 fee, address pool, uint256)";
export const ADDLIQUIDITY_EVENT_ABI: string = "event Mint(address indexed sender, uint256 amount0, uint256 amount1)";
export const BURN_EVENT_ABI: string = "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)";
export const DEPOSIT_EVENT_ABI: string = "event Deposit(address indexed sender, uint256 amount0, uint256 amount1)";
export const WITHDRAW_EVENT_ABI: string = "event Withdraw(address indexed sender, uint256 amount0, uint256 amount1)";
export const EMERGENCYWITHDRAW_EVENT_ABI: string = "event EmergencyWithdraw(address indexed sender, uint256 amount0, uint256 amount1)";
export const SWAP_EVENT_ABI: string = "event Swap(address indexed sender, int256 amount0In, int256 amount1In, int256 amount0Out, int256 amount1Out, address indexed to)";
export const TRANSFER_EVENT_ABI: string = "event Transfer(address indexed from, address to, uint256 value)";
export const APPROVAL_EVENT_ABI: string = "event Approval(address indexed owner, address indexed spender, uint256 value)";
export const MINT_EVENT_ABI: string = "event Mint(address indexed to, uint256 value)";
export const SYNC_EVENT_ABI: string = "event Sync(uint112 reserve0, uint112 reserve1)";
export const REMOVELIQUIDITY_EVENT_ABI: string = "event RemoveLiquidity(address indexed provider, uint256 indexed token0, uint256 indexed token1, uint256 liquidity, uint256 amount0, uint256 amount1)";
export const CONTRACT_CREATION_EVENT_ABI: string = "event ContractCreated(address indexed creator, address indexed contractAddress)";
export const REMOVELIQUIDITYIMBALANCE_EVENT_ABI: string = "event RemoveLiquidityImbalance(address,uint256[3],uint256[3],uint256,uint256)";
export const ERC20ABI = ["function balanceOf(address account) public view returns (uint256)"];
export const PAIR_ABI = [
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
];
export const INIT_CODE_PAIR_HASH = "0x00fb7f630766e6a796048ea87d01acd3068e8ff67d078148a3fa3f4a84f69bd5";


// Addresses of the Swap v3 Factories for the 7 EVMS
export const SWAP_FACTORY_ADDRESSES: Record<string, string> = {
  ethereum: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", //uniswap
  avalanche: "0x794C07912474351b3134E6D6B3B7b3b4A07cbAAa", //uniswap
  bsc: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73", //pancakeswap
  polygon: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32", //quickswap
  fantom: "0x514053a5bAa4CfEf80Aa7c2a55d2C8365A5B5EAd", //sushiswap
  arbitrum: "0x84fBa05A20F09a556eBAbf745d9e5DF5D794A038", //
  optimism: "0x1F98431c8aD98523631AE4a59f267346ea31F984" // uniswap
};

export const FUNCTIONS_ABI: string[] = [
  "function token0() public view returns (address)",
  "function token1() public view returns (address)",
  "function totalSupply() public view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
];


// sample rug pull addresses:
// 0x0c2561d7c8c19e46e0e0fbe02777d2efa424c8e5
// 0xdbdc3f41e7baf3e5b014a3eb91b86f3570ead94c
// 0xd8f50c796dc7e0ed6996e9bc2c1e219a5deb0500
// 0x801c6f81abf4b3f6471a57fcb8d0b6d867d2c959
// 0x193f159a0c6c85c95a1846517e9ca2804e4eeee7
// 0x3ea3ab861ef14797073b85ffb2bb991b07b69061
// 0x13635193cc8565e61b6524b4c27db7536ca90c3d
// 0xb30f0d842c01605c5f265329b4f7157a533d6164
// 0xa14bf1921cfef737c906a9741fa6a15b4fdf7d2e
// 0x758495749f64e5f2e8ed6b78792ca12c2ea79e17
// 0x955074c4171bd6eb80c0bdb15a8f0b39f7648b24
// 0x98794cb0956f1c87f5f5e7cc68be8e8ec5fe10b9
// 0xe43859c13d5dc6e0cf47bf78a42e21494d9530ef
// 0x39741522d210b23efea51635a93b84cb368b6669
// 0x7174732bdf3c57c22293dd727e0cf1154b8d0449
// 0xd752882e8a96dcf21a40f3520f57d0259b4bbb68
// 0xa629da6199973689aa6791a84847bb1e9c7bf876
