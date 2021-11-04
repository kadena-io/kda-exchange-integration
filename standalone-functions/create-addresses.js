var Pact = require('pact-lang-api')
var {
  NETWORK_ID,
  SERVER,
  TTL,
  HIGH_GAS_LIMIT,
  HIGH_GAS_PRICE,
  creationTime,
  host
} = require('../var/network-config.js')
var {
  checkKey,
} = require('../util/format-helpers.js')
var {
  pollTxRes,
  getPubFromPriv
} = require('../util/blockchain-helpers.js')
var {
  PUB_KEY,
  PRIV_KEY
} = require('../var/keys.js')

/** NOTE: This is a legacy function, and it is no longer required to pre-create an account
 *  accross all 20 chains for safety (as long as it is a k-style account)
**/

/**
 * Creates k-style addresses for a given public key list
 * @param tokenAddress {string} - this is the address of the token kda token is 'coin'
 *                                  an abritrary token example is 'runonflux.flux' for flux token deployed on our network
 * @param publicKeys {string} - list public keys for which you would like to create k-style
 *                                  addresses with
 * @param signingAccount {string} - address / account name of signing account
 * @param signingPrivKey {string} - private key assosciated with signing account
 * @return {string} success or failure with message
**/
const createAddresses = async (
  tokenAddress,
  publicKeys,
  signingAccount,
  signingPrivKey
) => {
  if (!publicKeys.map(x => checkKey(x)).reduce((p, c) => {return p && c}, true)) {
    return "CREATE ADDRESS FAILED: 1 or more public keys invalid"
  } else {
      const signingPubKey = getPubFromPriv(signingPrivKey);
      try {
        let pactCode = '';
        let envData = {};
        for (let i = 0; i < publicKeys.length; i++) {
          const ksName = `ks${i}`
          envData[ksName] = {
            "pred": "keys-all",
            "keys": [publicKeys[i]]
          }
          const kAccount = 'k:' + publicKeys[i]
          pactCode += `(${tokenAddress}.create-account ${JSON.stringify(kAccount)} (read-keyset "${ksName}"))`
        }
        const reqKeys = {};
        //register accounts on all 20 chains
        for (let i = 0; i < 20; i++) {
          let chainId = i.toString()
          const reqKey = await createAddressHelper(
            pactCode,
            chainId,
            envData,
            signingAccount,
            signingPubKey,
            signingPrivKey
          )
          reqKeys[chainId] = reqKey;
        }
        console.log(reqKeys)
        //poll all 20 chains for results
        pollResponses = {};
        failedPollResponses = {};
        for (let i = 0; i < 20; i++) {
          let chainId = i.toString();
          const pollRes = await pollTxRes(reqKeys[chainId], host(chainId));
          pollResponses[chainId] = pollRes
          if (pollResponses[chainId] === 'POLL FAILED: Please try again. Note that the transaction specified may not exist on target chain') {
            failedPollResponses[chainId] = pollResponses[chainId]
          }
        }
        console.log(pollResponses)
        //all were successfull
        if (Object.keys(failedPollResponses).length === 0) {
          return `CREATE ADDRESS SUCCESS: for ${publicKeys}`
        } else {
          console.log(failedPollResponses)
          return "CANNOT PROCESS CREATE ADDRESS: one or more chains failed to create. Please run method again with new keys"
        }
      } catch (e) {
        console.log(e);
        return "CANNOT PROCESS CREATE ADDRESS: network error"
      }

  }
}

/**
 * Helper to create address on one chain
 ** NOTE: to maintain safety of funds, please ensure the address is created on ALL 20 CHAINS
 ***      this is a necessary precauction as people may 'squat' on accounts
 * @param pactCode {string} - this is the pact code to send to a node
 * @param chainId {string} - chain id to write tx on
 * @param envData {object} - data to assosciate to tx
                                ex: { 'keyset': { 'pred':'keys-all', 'keys':[pub-key] } }
 * @param signingAccount {string} - address / account name of signing account
 * @param signingPrivKey {string} - public key assosciated with signing account
 * @param signingPrivKey {string} - private key assosciated with signing account
 * @return {string} success or failure with message
**/
const createAddressHelper = async (
  pactCode,
  chainId,
  envData,
  signingAccount,
  signingPubKey,
  signingPrivKey
) => {
  try {
    const cmd = {
      pactCode: pactCode,
      networkId: NETWORK_ID,
      keyPairs: [{
        //EXCHANGE ACCOUNT KEYS
        //  PLEASE KEEP SAFE
        //YOU CAN CONSIDER USING AN ACCOUNT WITH VERY FEW FUNDS IN IT
        //  an account with 1kda will create over a million addresses!
        //MUST HAVE FUNDS ON ALL CHAINS
        publicKey: signingPubKey,
        secretKey: signingPrivKey,
        clist: [
          //capability for gas
          {
            name: `coin.GAS`,
            args: []
          }
        ]
      }],
      meta: Pact.lang.mkMeta(signingAccount, chainId, HIGH_GAS_PRICE, HIGH_GAS_LIMIT, creationTime(), TTL),
      envData: envData,
    }
    const res = await Pact.fetch.send(cmd, host(chainId))
    console.log(res)
    const reqKey = res.requestKeys[0];
    return reqKey
  } catch (e) {
    console.log(e);
    return 'ERROR: tx not accepted by blockchain'
  }
}


//EXAMPLE CALL
//Pregenerate accounts that can be used later
//Save the generated keypairs somewhere
const keyPairs = [];
const publicKeys = [];

//MAXIMUM ~400 accounts can be created at once due to gas limit per block
//  each account creation consumes ~250 GAS
//  mainnet block gas limit is 150,000

//change from 100 to any number of account you would like to create
//  please keep it conservative as it depends on current network load
for (let i = 0; i < 100; i++) {
  const kp = Pact.crypto.genKeyPair();
  publicKeys.push(kp.publicKey);
  keyPairs.push(kp)
}

createAddresses('coin', publicKeys, PUB_KEY, PRIV_KEY);
