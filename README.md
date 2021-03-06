# Kadena Example Implementation for Exchanges

Easily integrate an exchange backend to Kadena's blokchain ecosystem

## Assumptions

- Exchange uses a single-sig public-key account
- It has enough funds to process the withdraws
- `tokenAddress` for kda token is `coin`
  - this can be replaced with the address of any other `fungible` token deployed on Kadena for example `free.anedak`


## Running

1. install `nodejs`

2. follow the example to run `processWithdraw()` from `main.js`

3. toggle testnet/mainnet and general network settings go to `var/network-config.js`
