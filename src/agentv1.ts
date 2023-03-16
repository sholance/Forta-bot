//version of agent that uses the handleAlert function

import { HandleTransaction, TransactionEvent, HandleAlert, AlertEvent, Initialize } from 'forta-agent'
// Monitor for token creators that are EOA with low reputation
import creatorMonitorFunctionAgent from "./token.creator.monitor";

// Monitor liquidity pools for the tracked token to see if no one else deposits liquidity into the pool
import liquidityPoolMonitorFunctionAgent from "./liquidity.pool.monitor";

// Monitor for when creator removes liquidity or takes large amount of token and sell on the token liquidity pool
import tokenLiquidityMonitorFunctionAgent from "./token.liquidity.monitor";

// type Agent = {
//     handleAlert: HandleAlert,
// }


// function provideHandleAlert(
//     creatorMonitorFunctionAgent: Agent,
//     liquidityPoolMonitorFunctionAgent: Agent,

//     tokenLiquidityMonitorFunctionAgent: Agent,
// ): HandleAlert {

//     return async function handleAlert(alertEvent: AlertEvent) {
//         const alert = alertEvent.alert;

//         const findings = (await Promise.all([
//             creatorMonitorFunctionAgent.handleAlert(alertEvent),
//               liquidityPoolMonitorFunctionAgent.handleAlert(alertEvent),
//               tokenLiquidityMonitorFunctionAgent.handleAlert(alertEvent)
//         ])).flat()

//         return findings
//     }
// }

// export default {
//     handleAlert: provideHandleAlert(
//         creatorMonitorFunctionAgent, 
//         liquidityPoolMonitorFunctionAgent, 
//         tokenLiquidityMonitorFunctionAgent
//     ),
// }