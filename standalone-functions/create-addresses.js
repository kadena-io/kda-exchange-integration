var Pact = require('pact-lang-api')
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


/**
 * Creates addresses for a given public key list
 ** NOTE: to maintain safety of funds, please ensure the address is created on ALL 20 CHAINS
 ***      this is a necessary precauction as people may 'squat' on accounts
 * @param tokenAddress {string} - this is the address of the token kda token is 'coin'
 *                                  an abritrary token example is 'runonflux.flux' for flux token deployed on our network
 * @param publicKeys {string} - list public key address of accounts you would like to create
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
          pactCode += `(${tokenAddress}.create-account ${JSON.stringify(publicKeys[i])} (read-keyset "${ksName}"))`
        }
        // const pactCode = `(${tokenAddress}.create-account ${JSON.stringify(publicKey)} (read-keyset "ks"))`
        const reqKeys = {};
        //register accounts on all 20 chains
        for (let i = 0; i < 20; i++) {
          let chainId = i.toString()
          const res = await Pact.fetch.send(
            {
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
              meta: Pact.lang.mkMeta(signingAccount, chainId, GAS_PRICE, 1400000, creationTime(), TTL),
              envData: envData,
            },
            host(chainId)
          )
          const reqKey = res.requestKeys[0];
          reqKeys[chainId] = reqKey;
        }
        //poll all 20 chains for results
        pollResponses = {};
        for (let i = 0; i < 20; i++) {
          let chainId = i.toString();
          const pollRes = await pollTxRes(reqKeys[chainId], host(chainId));
          pollResponses[chainId] = pollRes
        }
        //check all were successfull
        for (let i = 0; i < 20; i++) {
          let chainId = i.toString();
          if (pollResponses[chainId].result.status !== 'success') {
            return "CREATE ADDRESS FAILED: one or more addresses failed to create";
          }
        }
        //all were successfull
        return `CREATE ADDRESS SUCCESS: for ${publicKeys}`
      } catch (e) {
        console.log(e);
        return "CANNOT PROCESS CREATE ADDRESS: network error"
      }

  }
}

//EXAMPLE CALL
const keyPairs = [];
const publicKeys = [];
//MAXIMUM AROUND 1400 accounts at a time due to gas limit per block
for (let i = 0; i < 1000; i++) {
  const kp = Pact.crypto.genKeyPair();
  publicKeys.push(kp.publicKey);
  keyPairs.push(kp)
}
//save keypairs somewhere for future use
createAddresses('coin', publicKeys, PUB_KEY, PRIV_KEY);
