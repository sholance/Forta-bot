import { Contract, BigNumber, providers } from "ethers";
import { ALTERNATIVE_ABI, FUNCTIONS_ABI, SYMBOL_ABI_LIST } from "./constants";
import LRU from "lru-cache";
import { ethers } from "forta-agent";


export const NATIVE_TOKEN_SYMBOLS = [
  "BNB",
  "ETH",
  "MATIC",
  "SOL",
  "AVAX",
  "FTM",
  "BSC"
];
interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  timestamp: number;
}

export class PoolFetcher {
    private provider: providers.Provider;
    private cache: LRU<string, any[]>;

    constructor(provider: providers.Provider) {
        this.provider = provider;
        this.cache = new LRU<string, any[]>({ max: 10000 });
    }

    public async getPoolData(block: number, poolAddress: string): Promise<[boolean, string, string, BigNumber]> {
        let returnedValues: [boolean, string, string, BigNumber];
        const key: string = `pool-${poolAddress}-${block}`;
        if (this.cache.has(key)) return this.cache.get(key) as [boolean, string, string, BigNumber];
        const pool = new Contract(poolAddress, FUNCTIONS_ABI, this.provider);
        try {
            const [token0, token1, totalSupply] = await Promise.all([
                pool.token0({ blockTag: block }),
                pool.token1({ blockTag: block }),
                pool.totalSupply({ blockTag: block }),
            ]);
            returnedValues = [true, token0.toLowerCase(), token1.toLowerCase(), totalSupply];
        } catch {
            returnedValues = [false, "", "", BigNumber.from(0)];
        }
        this.cache.set(key, returnedValues);
        return returnedValues;
    }
    public async getPoolBalance(
        block: number,
        poolAddress: string,
        token0: string,
        token1: string
    ): Promise<[BigNumber, BigNumber, Number, Number]> {
        const key: string = `poolBalance-${poolAddress}-${block}`;
        if (this.cache.has(key)) return this.cache.get(key) as [BigNumber, BigNumber, Number, Number];
        const token0Contract = new Contract(token0, FUNCTIONS_ABI, this.provider);
        const token1Contract = new Contract(token1, FUNCTIONS_ABI, this.provider);
        const token0Timestamp = (await this.provider.getBlock(token0Contract.blockNumber)).timestamp;
        const token1Timestamp = (await this.provider.getBlock(token1Contract.blockNumber)).timestamp;

        let returnedValues: [BigNumber, BigNumber, Number, Number];
        try {
            const [balance0, balance1] = await Promise.all([
                token0Contract.balanceOf(poolAddress, { blockTag: block }),
                token1Contract.balanceOf(poolAddress, { blockTag: block }),
            ]);
            returnedValues = [BigNumber.from(balance0), BigNumber.from(balance1), token0Timestamp, token1Timestamp];
        } catch {
            returnedValues = [BigNumber.from(0), BigNumber.from(0), 0, 0];
        }
        this.cache.set(key, returnedValues);
        return returnedValues;
    }  
    // public async getTokenSymbolv1(
    //   block: number,
    //   tokenAddress: string,
    // ): Promise<string> {
    //   const key: string = `symbol-${tokenAddress}-${block}`;
      
    //   if (this.cache.has(key)) {
    //     return this.cache.get(key) as any;
    //   }
      
    //   const contract = new ethers.Contract(
    //     ethers.utils.getAddress(tokenAddress),
    //     FUNCTIONS_ABI,
    //     this.provider
    //   );
    
    //   let symbol: any;
    
    //   try {
    //     symbol = await contract.symbol({ blockTag: block });
    //   } catch (e) {
    //     try {
    //       const contractb = new ethers.Contract(
    //         tokenAddress,
    //         ALTERNATIVE_ABI,
    //         this.provider
    //       );
    //       const bytes32Symbol = await contractb.symbol();
    //       symbol = ethers.utils.parseBytes32String(bytes32Symbol);
    //     } catch (e) {
    //       symbol = "UNKNOWN";
    //     }
    //   }
    
    //   this.cache.set(key, symbol);
    
    //   return symbol;
    // }
    public async getTokenSymbol(
      block: number,
      tokenAddress: string,
    ): Promise<string> {
      const key: string = `symbol-${tokenAddress}-${block}`;
      
      if (this.cache.has(key)) {
        return this.cache.get(key) as any;
      }

    for (const abi of SYMBOL_ABI_LIST) {
      try {
        const contract = new ethers.Contract(tokenAddress, [abi], this.provider);
        const symbol = await contract.symbol();
        this.cache.set(key, symbol);
        return symbol;
      } catch (error) {
        continue;
      }
    }
  
    return 'UNKNOWN';
  }
}
