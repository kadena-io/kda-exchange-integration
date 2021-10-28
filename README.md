# Kadena Example Implementation for Exchanges

Easily integrate an exchange backend to Kadena's blockchain ecosystem

## Assumptions

- Exchange uses a single-sig k-account based on a public-key (see
  [https://medium.com/kadena-io/introducing-kadena-account-protocols-kip-0012-303462b77af1])
- It has enough funds to process the withdraws
- `tokenAddress` for kda token is `coin`
  - this can be replaced with the address of any other `fungible` token deployed on Kadena for example `free.anedak`


## Running

1. install `nodejs`

2. follow the example to run `processWithdraw()` from `main.js`

3. toggle testnet/mainnet and general network settings go to `var/network-config.js`

## Features

- `/util` dir
  - `blockchain-write.js` are function calls that write new data to the blockchain using the `/send` endpoint of a `chainweb-node`
  - `blockchain-read.js` are function calls that read data from the blockchain using the `/local` endpoint of a `chainweb-node`
    - you can use `getAcctDetails()` to fetch the balance for any account, including your own
- `/var` dir
  - `network-config.js` has all the relevant network settings to talk to the `chainweb-node` endpoints. Covers basic blockchain setup, such as specified metadata and target network
    - toggle here for app to talk to mainnet
  - `keys.js` contains a public and private key with few TESTNET funds
    - toggle here for own keypair
    - PLEASE KEEP SAFE
- `main.js` has a sample withdraw function implementation. If the sending account does not have enough funds on the target chain, `balanceFunds()` from `/util/blockchain-write.js` will be called to fund own account on the given chain.
  - Cross-chain transfers are always performed on own account to ensure user will always receive funds without having to pay for gas on the target chain
  - This assumes you have enough money to cover the withdraw spread out on other chains
