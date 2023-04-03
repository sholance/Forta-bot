import { Contract, BigNumber, providers } from "ethers";
// import { ethers } from "forta-agent";
// import { getCreate2Address } from "@ethersproject/address";
// import { utils } from "ethers";
// import { ERC20ABI, INIT_CODE_PAIR_HASH, PAIR_ABI, FUNCTIONS_ABI } from "./constants";
// import LRU from "lru-cache";

export const LARGE_THRESHOLD = BigNumber.from("2"); // percent
export const POOL_SUPPLY_THRESHOLD: BigNumber = BigNumber.from("100000000000");
export const THRESHOLD_PERCENTAGE: BigNumber = BigNumber.from(89);


// export const createPair = (token0: string, token1: string, factory: string): string => {
//     let salt: string = utils.solidityKeccak256(["address", "address"], [token0, token1]);
//     return ethers.utils.getAddress(getCreate2Address(factory, salt, INIT_CODE_PAIR_HASH).toLowerCase());
// };


// export class DataFetcher {
//     private provider: providers.Provider;
//     private cache: LRU<string, [boolean, string, string] | BigNumber>;

//     constructor(provider: providers.Provider) {
//         this.provider = provider;
//         this.cache = new LRU<string, [boolean, string, string] | BigNumber>({ max: 10000 });
//     }

//     public async isValidPair(
//         pairAddress: string,
//         block: number,
//         FactoryAddr: string,
//         init: string
//     ): Promise<[boolean, string, string]> {
//         const key: string = `pool-${pairAddress}-${block}`;
//         if (this.cache.has(key)) return this.cache.get(key) as [boolean, string, string];
//         const pairContract = new Contract(pairAddress, PAIR_ABI, this.provider);
//         let token0Address: string, token1Address: string;
//         try {
//             [token0Address, token1Address] = await Promise.all([
//                 pairContract.token0({ blockTag: block }),
//                 pairContract.token1({ blockTag: block }),
//             ]);
//         } catch {
//             return [false, "", ""];
//         }
//         const tokenPair = createPair(token0Address, token1Address, FactoryAddr);
//         const isValid = tokenPair.toLowerCase() === pairAddress.toLowerCase() ? true : false;
//         this.cache.set(key, [isValid, token0Address.toLowerCase(), token1Address.toLowerCase()]);
//         return [isValid, token0Address.toLowerCase(), token1Address.toLowerCase()];
//     }

//     public async getERC20Balance(tokenAddress: string, pairAddress: string, blockNumber: number): Promise<BigNumber> {
//         const key: string = `poolBalance-${pairAddress}-${tokenAddress}-${blockNumber}`;
//         if (this.cache.has(key)) return this.cache.get(key) as BigNumber;
//         const tokenContract = new Contract(tokenAddress, ERC20ABI, this.provider);
//         let balance: BigNumber;
//         try {
//             balance = BigNumber.from(await tokenContract.balanceOf(pairAddress, { blockTag: blockNumber }));
//         } catch {
//             return BigNumber.from("0");
//         }
//         this.cache.set(key, balance);
//         return balance;
//     }
// }

// export class PoolFetcher {
//     private provider: providers.Provider;
//     private cache: LRU<string, any[]>;

//     constructor(provider: providers.Provider) {
//         this.provider = provider;
//         this.cache = new LRU<string, any[]>({ max: 10000 });
//     }

//     public async getPoolData(block: number, poolAddress: string): Promise<[boolean, string, string, BigNumber]> {
//         let returnedValues: [boolean, string, string, BigNumber];
//         const key: string = `pool-${poolAddress}-${block}`;
//         if (this.cache.has(key)) return this.cache.get(key) as [boolean, string, string, BigNumber];
//         const pool = new Contract(poolAddress, FUNCTIONS_ABI, this.provider);
//         try {
//             const [token0, token1, totalSupply] = await Promise.all([
//                 pool.token0({ blockTag: block }),
//                 pool.token1({ blockTag: block }),
//                 pool.totalSupply({ blockTag: block }),
//             ]);
//             returnedValues = [true, token0.toLowerCase(), token1.toLowerCase(), totalSupply];
//         } catch {
//             returnedValues = [false, "", "", BigNumber.from(0)];
//         }
//         this.cache.set(key, returnedValues);
//         return returnedValues;
//     }

//     public async getPoolBalance(
//         block: number,
//         poolAddress: string,
//         token0: string,
//         token1: string
//     ): Promise<[BigNumber, BigNumber]> {
//         const key: string = `poolBalance-${poolAddress}-${block}`;
//         if (this.cache.has(key)) return this.cache.get(key) as [BigNumber, BigNumber];
//         const token0Contract = new Contract(token0, FUNCTIONS_ABI, this.provider);
//         const token1Contract = new Contract(token1, FUNCTIONS_ABI, this.provider);
//         let returnedValues: [BigNumber, BigNumber];
//         try {
//             const [balance0, balance1] = await Promise.all([
//                 token0Contract.balanceOf(poolAddress, { blockTag: block }),
//                 token1Contract.balanceOf(poolAddress, { blockTag: block }),
//             ]);
//             returnedValues = [BigNumber.from(balance0), BigNumber.from(balance1)];
//         } catch {
//             returnedValues = [BigNumber.from(0), BigNumber.from(0)];
//         }
//         this.cache.set(key, returnedValues);
//         return returnedValues;
//     }
// }
// export class TokenFetcher {
//     readonly provider: providers.Provider;
//     private balanceOfCache: LRU<string, BigNumber>;
//     private tokenContract: Contract;

//     constructor(provider: providers.Provider, tokenAddress: string) {
//         this.provider = provider;
//         this.balanceOfCache = new LRU<string, BigNumber>({ max: 1000 });
//         this.tokenContract = new Contract(tokenAddress, ERC20ABI, provider);
//     }

//     public async getBalanceOf(masterchefAddress: string, block: string | number) {
//         const key: string = `${masterchefAddress}-${block}`;
//         if (this.balanceOfCache.has(key)) return this.balanceOfCache.get(key) as BigNumber;
//         const balance = await this.tokenContract.balanceOf(masterchefAddress, { blockTag: block });
//         this.balanceOfCache.set(key, balance);
//         return balance;
//     }
// }
