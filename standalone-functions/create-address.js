var Pact = require('../util/pact-lang-api.js')
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
 * Creates an address for a given public key
 ** NOTE: to maintain safety of funds, please ensure the address is created on ALL 20 CHAINS
 ***      this is a necessary precauction as people may 'squat' on accounts
 * @param tokenAddress {string} - this is the address of the token kda token is 'coin'
 *                                  an abritrary token example is 'runonflux.flux' for flux token deployed on our network
 * @param publicKey {string} - public key address of account you would like to create
 * @return {string} success or failure with message
**/
const createAddress = async (
  tokenAddress,
  publicKey,
  signingAccount,
  signingPrivKey
) => {
  if (!checkKey(publicKey)) {
    return "CREATE ADDRESS FAILED: invalid public key format"
  } else {
      const signingPubKey = getPubFromPriv(signingPrivKey);
      try {
        const pactCode = `(${tokenAddress}.create-account ${JSON.stringify(publicKey)} (read-keyset "ks"))`
        const reqKeys = {};
        //register account on all 20 chains
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
              meta: Pact.lang.mkMeta(signingAccount, chainId, GAS_PRICE, GAS_LIMIT, creationTime(), TTL),
              envData: {
                "ks": {
                  "pred": "keys-all",
                  "keys": [publicKey]
                }
              },
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
        return `CREATE ADDRESS SUCCESS: for ${publicKey}`
      } catch (e) {
        console.log(e);
        return "CANNOT PROCESS CREATE ADDRESS: network error"
      }

  }
}

//EXAMPLE CALL
createAddress('coin', 'c728dea18156e7b2e63b2bc7b45779b57dadc78457bbbf2f8cd446a0122159e0', PUB_KEY, PRIV_KEY);
