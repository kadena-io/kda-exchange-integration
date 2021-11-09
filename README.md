# Kadena Example Implementation for Exchanges

Easily integrate an exchange backend to Kadena's blockchain ecosystem

## Assumptions

- Exchange uses a single-sig k-account based on a public-key (see
  (https://medium.com/kadena-io/introducing-kadena-account-protocols-kip-0012-303462b77af1) )
- It has enough funds to process the withdraws
- `tokenAddress` for kda token is `coin`
  - this can be replaced with the address of any other `fungible` token deployed on Kadena for example `free.anedak`

## Required Infrastructure
It is highly reccomended that any exchange run their own node. Instructions for doing so can be
found here: (https://github.com/kadena-io/chainweb-node#configuring-running-and-monitoring-the-health-of-a-chainweb-node)

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

## An aside on k-accounts and chainweb's account model
In chainweb each of the 20 chains function as independent blockchains with their own state
(though the chains run an identical protocol and behave the same way).
This allows for the possiblity of having multiple accounts with the same
name accross the 20 different chains. These multiple accounts of the same name may each be potenitally
controlled by a different set of keys. To make things simpler, Kadena has introduced KIP-12
(https://medium.com/kadena-io/introducing-kadena-account-protocols-kip-0012-303462b77af1) to allow a
user to reserve an account-name controlled by a single public key across all 20 chains. The account
name must be of the form: "k:<public-key>". As an example, suppose the public key is: `70c67dabe9a54d1970461de00009f074e2ea22589dab553d159b6e1e93ae7e27`. 
Then the account name should be named `k:70c67dabe9a54d1970461de00009f074e2ea22589dab553d159b6e1e93ae7e27`. No one will
be able to create an account named `k:70c67dabe9a54d1970461de00009f074e2ea22589dab553d159b6e1e93ae7e27` on any of the
chains without access to the private key corresponding to the public key: `70c67dabe9a54d1970461de00009f074e2ea22589dab553d159b6e1e93ae7e27`

## Example

### Account name creation:

```javascript
var Pact = require('pact-lang-api')

//Pregenerate accounts that can be used later
//Save the generated keypairs somewhere
const keyPairs = [];
// Each of these accounts can be used with the correspondingly indexed keypair
const kAccounts = [];

//change from 100 to any number of keys you would like to create
for (let i = 0; i < 100; i++) {
  const kp = Pact.crypto.genKeyPair();
  kAccounts.push('k:' + kp.publicKey);
  keyPairs.push(kp)
}
```

### Withdrawal
```javascript
var {
  processWithdraw
} = require('./main.js')

var {
  getAcctDetails,
} = require('./util/blockchain-read.js')

// Same example keys and account from var/keys.js
const EXCHANGE_PRIVKEY = 'd817273c1d2ef7e2ababf8cfe0579bc1ffd2c36845684a3ae4b3275e215b2080'
const EXCHANGE_PUBKEY = '70c67dabe9a54d1970461de00009f074e2ea22589dab553d159b6e1e93ae7e27'
// Exchange account; MUST BE FUNDED on at least one of the chains
const EXCHANGE_KACCOUNT = 'k:' + EXCHANGE_PUBKEY

// We only deposit to k-accounts
const customerAddress = "k:9be19442151c880492ec0fddc5bdbe9eccd243b8d723f4673b317f10b2e5d515"


// Withdrawal for 10 KDA to account: 'k:9be19442151c880492ec0fddc5bdbe9eccd243b8d723f4673b317f10b2e5d515
// on chain 13 . Assumes a sufficient balance on EXCHANGE_ACCOUNT
processWithdraw('coin', EXCHANGE_KACCOUNT, EXCHANGE_PRIVKEY, customerAddress, 10, "13").then((res) => console.log(res))
```

