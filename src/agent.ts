import { HandleTransaction, TransactionEvent } from 'forta-agent'

// Monitor for token creators that are EOA with low reputation
import creatorMonitorFunctionAgent from "./token.creator.monitor";

// Monitor liquidity pools for the tracked token to see if no one else deposits liquidity into the pool
import liquidityPoolMonitorFunctionAgent from "./liquidity.pool.monitor";

// Monitor for when creator removes liquidity or takes large amount of token and sell on the token liquidity pool
// import tokenLiquidityMonitorFunctionAgent from "./token.liquidity.monitor";


type Agent = {
  handleTransaction: HandleTransaction,
}

let findingsCount = 0;

function provideHandleTransaction(
    liquidityPoolMonitorFunctionAgent: Agent,
    creatorMonitorFunctionAgent: Agent,
    // tokenLiquidityMonitorFunctionAgent: Agent,
) {
  return async function handleTransaction(txEvent: TransactionEvent) {
    // limiting this agent to emit only 5 findings so that the alert feed is not spammed
    if (findingsCount >= 5) return [];

    const findings = (
      await Promise.all([
        liquidityPoolMonitorFunctionAgent.handleTransaction(txEvent),
        creatorMonitorFunctionAgent.handleTransaction(txEvent),
        // track pool with handleAlert
        
        // tokenLiquidityMonitorFunctionAgent.handleTransaction(txEvent),
      ])
    ).flat();

    findingsCount += findings.length;
    return findings;
  };
}

module.exports = {
  provideHandleTransaction,
  handleAlerts: provideHandleTransaction(
    liquidityPoolMonitorFunctionAgent,
    creatorMonitorFunctionAgent,
  // tokenLiquidityMonitorFunctionAgent,
  ),
};