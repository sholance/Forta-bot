export const TOKEN_ADDRESS = "0x801c6f81abf4b3f6471a57fcb8d0b6d867d2c959"

export const EVENTS_ABI = [
    "event Deposit(address indexed user, uint256 indexed pid, uint256 amount)",
    "event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)",
    "event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount)",
    "event PairCreated(address indexed token0, address indexed token1, address pair, uint)",
    "event PoolCreated(address token0, address token1, uint24 fee, int24 tickSpacing, address pool)",    
    "function lpToken(uint256 input) public view returns (address token)",
  ];

  export const FUNCTIONS_ABI: string[] = [
    "function token0() public view returns (address)",
    "function token1() public view returns (address)",
    "function totalSupply() public view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)",
    "function name() external view returns (string memory)",
  ];

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
