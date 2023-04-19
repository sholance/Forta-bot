import { HandleTransaction, TransactionEvent, getEthersProvider } from 'forta-agent'
import { providers } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
// Monitor for token creators that are EOA with low reputation
import creatorMonitorFunctionAgent from "./token.creator.monitor";

// Monitor all liquidity pools to see if no one else deposits liquidity into the pool
import liquidityPoolMonitorFunctionAgent from "./liquidity.pool.monitor";

// Monitor for when creator removes liquidity or takes large amount of token and sell on the token liquidity pool
import tokenLiquidityMonitorFunctionAgent from "./token.liquidity.monitor";

import tokenRemovalMonitorFunctionAgent from './token.removal.monitor';
// Monitor for when creator removes liquidity or takes 90% out of liquidity pool

type Agent = {
  handleTransaction: HandleTransaction,
}
const networkManager = new NetworkManager(NETWORK_MAP);

export const provideInitialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

function provideHandleTransaction(
  creatorMonitorFunctionAgent: Agent,
  liquidityPoolMonitorFunctionAgent: Agent,
  tokenLiquidityMonitorFunctionAgent: Agent,
  tokenRemovalMonitorFunctionAgent: Agent
): HandleTransaction {

  return async function handleTransaction(txEvent: TransactionEvent) {
    try {
    const findings = (await Promise.all([
      creatorMonitorFunctionAgent.handleTransaction(txEvent),
      liquidityPoolMonitorFunctionAgent.handleTransaction(txEvent),
      tokenLiquidityMonitorFunctionAgent.handleTransaction(txEvent),
      tokenRemovalMonitorFunctionAgent.handleTransaction(txEvent)
    ])).flat()

    return findings
    } catch (error) {
      console.log(error)
      return []
    }
  }
}

export default {
  handleTransaction: provideHandleTransaction(
    creatorMonitorFunctionAgent,
    liquidityPoolMonitorFunctionAgent,
    tokenLiquidityMonitorFunctionAgent,
    tokenRemovalMonitorFunctionAgent
  ),
  initialize: provideInitialize(getEthersProvider()),
}