# Soft Rug Pull Detection Agent

## Description

This agent monitors transactions on the Ethereum network for suspicious activity related to token creators, liquidity pools, and token liquidity

## Supported Chains

- Ethereum
- Avalanche
- Binance Smart Chain
- Polygon
- Fantom
- Arbitrum
- Optimism


## Alerts

Describe each of the type of alerts fired by this agent

- SOFT-RUG-PULL-SUS-LIQ-POOL-CREATION
  - Fired when a liquidity pools creator is detected to have a low reputation score by tracking the number of transactions they have
  - Severity is always set to "Info"
  - Type is always set to "suspicious"
  - Metadata field contains symbol, attackerAddress, transaction, tokenaddress, nonce, contractaddress, event and deployer
  - Label field contains entityType, entity, label, and confidence for the address


- SOFT-RUG-PULL-SUS-LIQ-POOL-RESERVE-CHANGE
  - Fired when a liquidity pool is detected to have no other liquidity providers
  - Severity is always set to "medium"
  - Type is always set to "suspicious"
  - Metadata field contains symbol, attackerAddress, transaction, tokenaddress, contractaddress and deployer
  - Label field contains entityType, entity, label, and confidence for address and transaction


- SOFT-RUG-PULL-SUS-POOL-REMOVAL
  - Fired when a token creator is detected to have removed liquidity from a liquidity pool
  - Fired when 90% of the liquidity is removed from a liquidity pool
  - Severity is always set to "medium"
  - Type is always set to "suspicious"
  - Metadata field contains symbol, attackerAddress, transaction, tokenaddress, contractaddress and deployer
  - Label field contains entityType, entity, label, and confidence for address and transaction


## Test Data

The agent behaviour can be verified with the following tokens:

- 0xdbdc3f41e7baf3e5b014a3eb91b86f3570ead94c (RUG-2)

TODO: Add more test data