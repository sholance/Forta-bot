interface NetworkData {
    factory: string;
  }
  const ETH_factory: NetworkData = {
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
  };
  const BSC_factory: NetworkData = {
    factory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
  };
  const OPTIMISM_factory: NetworkData = {
    factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  };
  const POLYGON_factory: NetworkData = {
    factory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
  };
  const FANTOM_factory: NetworkData = {
    factory: "0x514053a5bAa4CfEf80Aa7c2a55d2C8365A5B5EAd",
  };
  const ARBITRUM_factory: NetworkData = {
    factory: "0x84fBa05A20F09a556eBAbf745d9e5DF5D794A038",
  };
  const AVALANCHE_factory: NetworkData = {
    factory: "0x794C07912474351b3134E6D6B3B7b3b4A07cbAAa",
  };
  
  
  export const NETWORK_MAP: Record<number, NetworkData> = {
    1: ETH_factory, // Ethereum 
    10: OPTIMISM_factory, // Optimism
    56: BSC_factory, // Binance Smart Chain
    137: POLYGON_factory, // Polygon 
    250: FANTOM_factory, // fantom
    42161: ARBITRUM_factory, // Arbitrum One
    43114: AVALANCHE_factory, // Avalanche
  };
  
  export default class NetworkManager implements NetworkData {
    public factory: string;
    networkMap: Record<number, NetworkData>;
  
    constructor(networkMap: Record<number, NetworkData>) {
      this.factory = "";
      this.networkMap = networkMap;
    }
  
    public setNetwork(networkId: number) {
      try {
        const { factory } = this.networkMap[networkId];
        this.factory = factory;
      } catch {
        // The bot is run in a network not defined in the networkMap.
        // There's no contract deployed in that network.
        throw new Error("You are running the bot in a non supported network");
      }
    }
  }