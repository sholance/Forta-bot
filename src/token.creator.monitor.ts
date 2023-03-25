import {
    Finding,
    HandleTransaction,
    FindingSeverity,
    FindingType,
    getEthersProvider,
    ethers,
    TransactionEvent,
  EntityType,
  } from 'forta-agent';
  
const { SWAP_FACTORY_ADDRESSES, PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI, MIN_TRANSACTIONS } = require('./constants');
  
  const ethersProvider = getEthersProvider();
  
  function provideHandleTransaction(
    ethersProvider: ethers.providers.JsonRpcProvider
  ): HandleTransaction {
    return async function handleTransaction(txEvent: TransactionEvent) {
      const findings: Finding[] = [];
  
      for (const factoryAddress of SWAP_FACTORY_ADDRESSES) {
        const token = new ethers.Contract(factoryAddress, [PAIRCREATED_EVENT_ABI, POOLCREATED_EVENT_ABI], ethersProvider);
        const latestBlock = await ethersProvider.getBlockNumber();
        const events = await token.queryFilter('PairCreated || PoolCreated', latestBlock - 700, latestBlock);
  
        for (const event of events) {
          const tx = await ethersProvider.getTransactionReceipt(event.transactionHash);
          const creator = tx.from;
          const creatorTransactions = await ethersProvider.getTransactionCount(creator, latestBlock);
          if (creatorTransactions < MIN_TRANSACTIONS) {
            findings.push(
              Finding.fromObject({
                name: 'Potentially Suspicious Liquidity Pool Creator',
                description: `Liquidity pool created by ${creator} with only ${creatorTransactions} transactions`,
                alertId: 'RUG-1',
                severity: FindingSeverity.Info,
                type: FindingType.Suspicious,
                labels: [
                  {
                    entityType: EntityType.Address,
                    entity: creator,
                    label: 'creator',
                    confidence: 0.6,
                    remove: false,
                  },
                ],
              })
            );
          }
        }
      }
  
      return findings;
    };
  }
  
  export default {
    provideHandleTransaction,
    handleTransaction: provideHandleTransaction(ethersProvider),
  };
  