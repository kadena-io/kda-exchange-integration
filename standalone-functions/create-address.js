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
  pollTxRes
} = require('../util/blockchain-helpers.js')
var {
  PUB_KEY,
  PRIV_KEY
} = require('../var/keys.js')


//NOTE: to maintain safety of funds, please ensure the address is created on ALL 20 CHAINS
//      this is a necessary precauction as people may 'squat' on accounts

//create a single kadena address on all 20 chains
//  will fail if if does not succeed on all chains
const createAddress = async (
  tokenAddress,
  publicKey
) => {
  if (!checkKey(publicKey)) {
    return "CREATE ADDRESS FAILED: invalid public key format"
  } else {
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
                publicKey: PUB_KEY,
                secretKey: PRIV_KEY,
                clist: [
                  //capability for gas
                  {
                    name: `coin.GAS`,
                    args: []
                  }
                ]
              }],
              meta: Pact.lang.mkMeta(PUB_KEY, chainId, GAS_PRICE, GAS_LIMIT, creationTime(), TTL),
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
// createAddress('coin', '092a219fea5c47ddfdecd6b8414b115b5c8f325e897c271dd77a493c3d0a636f');
