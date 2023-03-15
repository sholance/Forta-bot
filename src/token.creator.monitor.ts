//tweak from minimum balance

import {
    Finding,
    HandleTransaction,
    FindingSeverity,
    FindingType,
    getEthersProvider,
    ethers,
    TransactionEvent,
  } from 'forta-agent';
  
  const {TOKEN_ADDRESS} = require("./constants");
  const MIN_TRANSACTIONS = 10;
  
  const ethersProvider = getEthersProvider();
  
  function provideHandleTransaction(
    ethersProvider: ethers.providers.JsonRpcProvider
  ): HandleTransaction {
        return async function handleTransaction(txEvent: TransactionEvent) {
      const findings: Finding[] = [];
  
      const token = new ethers.Contract(TOKEN_ADDRESS, [
        'event PairCreated(address indexed token0, address indexed token1, uint24 indexed fee, address pool, uint256)'
      ], ethersProvider);
      const latestBlock = await ethersProvider.getBlockNumber();
      const events = await token.queryFilter('PairCreated', latestBlock - 700, latestBlock);
  
      for (const event of events) {
        const tx = await ethersProvider.getTransactionReceipt(event.transactionHash);
        const creator = tx.from;
        const creatorTransactions = await ethersProvider.getTransactionCount(creator, latestBlock);
        if (creatorTransactions < MIN_TRANSACTIONS) {
          findings.push(
            Finding.fromObject({
              name: "Potentially Suspicious Liquidity Pool Creator",
              description: `Liquidity pool created by ${creator} with only ${creatorTransactions} transactions`,
              alertId: "SHOLA-2",
              severity: FindingSeverity.Info,
              type: FindingType.Suspicious,
              metadata: {
                creator,
                transactions: creatorTransactions.toString(),
              },
            })
          );
        }
      }
  
      return findings;
    };
  }
  
  export default {
    provideHandleTransaction,
    handleTransaction: provideHandleTransaction(ethersProvider),
  };
  