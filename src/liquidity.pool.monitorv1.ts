import {
    Finding,
    FindingSeverity,
    FindingType,
    getEthersProvider,
    TransactionEvent,
    ethers,
  } from 'forta-agent';
  
  const { TOKEN_ADDRESS } = require("./constants");
  
  const ethersProvider = getEthersProvider();
  const POOL_CREATION_EVENT = 'event PairCreated(address indexed token0, address indexed token1, uint24 indexed fee, address pool, uint256)'
  const liquidityPoolContract = new ethers.Contract(TOKEN_ADDRESS, [
    'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  ], ethersProvider);


async function handleTransaction(txEvent: TransactionEvent) {
      const findings: Finding[] = [];


      const liquiditPoolEvents = txEvent.filterLog(
        POOL_CREATION_EVENT,
        TOKEN_ADDRESS
      );
    

      const pairCreatedFilter = {
        address: liquidityPoolContract.address,
        topics: [ethers.utils.id('PairCreated(address,address,address,uint256)')],
      };
  
      const latestBlock = await ethersProvider.getBlockNumber();
      const events = await liquidityPoolContract.queryFilter(pairCreatedFilter, latestBlock - 700, latestBlock);
  
      for (const event of events) {
        const pairAddress = "";
        const pair = new ethers.Contract(pairAddress, [
          'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
          'function token0() external view returns (address)',
          'function token1() external view returns (address)',
        ], ethersProvider);
  
        const [reserve0, reserve1] = await pair.getReserves();
        const token0 = await pair.token0();
        const token1 = await pair.token1();
  
        // get the number of liquidity providers for this pair
        const providerCount = await liquidityPoolContract.getPair(token0, token1)
          .then(async (pairAddress: string) => {
            const pair = new ethers.Contract(pairAddress, [
              'function balanceOf(address owner) external view returns (uint256)',
            ], ethersProvider);
            const totalSupply = await pair.totalSupply();
            const lp0Balance = await pair.balanceOf(pair.token0());
            const lp1Balance = await pair.balanceOf(pair.token1());
            if (lp0Balance === totalSupply || lp1Balance === totalSupply) {
              // if one of the balances is equal to the total supply, then there's only one liquidity provider
              return 1;
            } else if (lp0Balance === 0 && lp1Balance === 0) {
              // if both balances are zero, then there are no liquidity providers
              return 0;
            } else {
              return 2; // otherwise, there are two liquidity providers
            }
          });
  
        if (providerCount <= 1) {
          findings.push(
            Finding.fromObject({
              name: "Potentially Suspicious Liquidity Pool",
              description: `Liquidity pool ${pairAddress} for tokens ${token0} and ${token1} has only ${providerCount} liquidity provider(s)`,
              alertId: "FORTA-8",
              severity: FindingSeverity.Medium,
              type: FindingType.Suspicious,
              metadata: {
                pairAddress,
                token0,
                token1,
                providerCount,
              },
            })
          );
        }
      }
  
      return findings;
    };
  
  
  export default {
    handleTransaction,
  }
  