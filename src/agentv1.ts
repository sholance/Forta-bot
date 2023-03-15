import { HandleTransaction, TransactionEvent, Alert } from 'forta-agent';

// Monitor for token creators that are EOA with low reputation
import creatorMonitorFunctionAgent from "./token.creator.monitor";

// Monitor liquidity pools for the tracked token to see if no one else deposits liquidity into the pool
import liquidityPoolMonitorFunctionAgent from "./liquidity.pool.monitor";

// Monitor for when creator removes liquidity or takes large amount of token and sell on the token liquidity pool
// import tokenLiquidityMonitorAgent from "./token.liquidity.monitor";

type Agent = {
  handleTransaction: HandleTransaction;
};

function provideHandleTransaction(
    liquidityPoolMonitorFunctionAgent: Agent,
  creatorMonitorFunctionAgent: Agent,
//   trackPoolFunctionAgent: Agent,
) {
  return async function handleTransaction(
    txEvent: TransactionEvent,
  ): Promise<Alert[]> {
    const alerts: Alert[] = [];

    // Handle alerts from all three agents
    const creatorMonitorAlerts = await creatorMonitorFunctionAgent.handleTransaction(
        txEvent,
      );
    const liquidityCheckAlerts = await liquidityPoolMonitorFunctionAgent.handleTransaction(
      txEvent,
    );
    // const trackPoolAlerts = await trackPoolFunctionAgent.handleTransaction(
    //   txEvent,
    // );

    // alerts.push(
    //   ...creatorMonitorAlerts,
    //   ...liquidityCheckAlerts,
    // //   ...trackPoolAlerts,
    // );

    return alerts;
  };
}

module.exports = {
  provideHandleTransaction,
  handleAlerts: provideHandleTransaction(
    liquidityPoolMonitorFunctionAgent,
    creatorMonitorFunctionAgent,
    // trackPoolFunctionAgent,
  ),
};
