// import Pact from 'pact-lang-api.js'
// import {
//   NETWORK_ID,
//   SERVER,
//   TTL,
//   GAS_LIMIT,
//   GAS_PRICE,
//   creationTime,
//   host
// } from '../var/network-config.js'
// import {
//   PUB_KEY,
//   PRIV_KEY
// } from '../var/keys.js'
// import {
//   getAcctDetails
// } from './blockchain-read.js'
// import {
//   pollTxResult
// } from './blockchain-helpers.js'
// import {
//   checkKey,
//   formatAmount
// } from './format-helpers.js
var Pact = require('./pact-lang-api.js')
var {
  NETWORK_ID,
  SERVER,
  TTL,
  GAS_LIMIT,
  GAS_PRICE,
  creationTime,
  host
} = require('../var/network-config.js')
var {
  PUB_KEY,
  PRIV_KEY
} = require('../var/keys.js')
var {
  getAcctDetails
} = require('./blockchain-read.js')
var {
  pollTxRes
} = require('./blockchain-helpers.js')
var {
  checkKey,
  formatAmount
} = require('./format-helpers.js')


const transfer = async (
  fromAcct,
  toAcct,
  amount,
  chainId,
  guard
) => {
  try {
    const res = await Pact.fetch.send(
      {
        pactCode: `(coin.transfer-create ${JSON.stringify(fromAcct)} ${JSON.stringify(toAcct)} (read-keyset "recp-ks") ${formatAmount(amount)})`,
        networkId: NETWORK_ID,
        keyPairs: [{
          //EXCHANGE ACCOUNT KEYS
          //  PLEASE KEEP SAFE
          publicKey: PUB_KEY,
          secretKey: PRIV_KEY,
          clist: [
            //capability to transfer
            {
              name: "coin.TRANSFER",
              args: [fromAcct, toAcct, +formatAmount(amount)]
            },
            //capability for gas
            {
              name: `coin.GAS`,
              args: []
            }
          ]
        }],
        meta: Pact.lang.mkMeta(fromAcct, chainId, GAS_PRICE, GAS_LIMIT, creationTime(), TTL),
        envData: {
          "recp-ks": guard
        },
      },
      host(chainId)
    )
    const reqKey = res.requestKeys[0]
    console.log(reqKey)
    const txSuccess = await pollTxRes(reqKey, host(chainId));
    console.log(txSuccess)
    if (txSuccess) {
      return "TRANSFER SUCCESS"
    } else {
      return "CANNOT PROCESS TRANSFER: invalid blockchain tx"
    }
  } catch (e) {
    console.log(e);
    return "CANNOT PROCESS TRANSFER: network error"
  }
}

transfer(PUB_KEY, "francesco", 0.00001, "0", {"pred":"keys-all","keys":["4b0f29b9e0a996587e5b5524731c91ecf02ecaa8b7e70e5f8f1881c5f0c18fc1"]})
