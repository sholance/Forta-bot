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

- RUG-1
  - Fired when a liquidity pools creator is detected to have a low reputation score by tracking the number of transactions they have

- RUG-2
  - Fired when a liquidity pool is detected to have no other liquidity providers

- RUG-3
  - Fired when a token creator is detected to have removed liquidity from a liquidity pool
  - Fired when a token creator is detected to have taken a large amount of token and sold it on the token liquidity pool


## Test Data

The agent behaviour can be verified with the following tokens:

- 0xdbdc3f41e7baf3e5b014a3eb91b86f3570ead94c (RUG-2)

TODO: Add more test data