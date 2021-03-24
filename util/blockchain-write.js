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
  pollTxRes,
  sleepPromise,
  makePactContCommand
} = require('./blockchain-helpers.js')
var {
  checkKey,
  formatAmount
} = require('./format-helpers.js')


const transfer = async (
  tokenAddress,
  fromAcct,
  toAcct,
  amount,
  chainId,
  guard
) => {
  try {
    const res = await Pact.fetch.send(
      {
        pactCode: `(${tokenAddress}.transfer-create ${JSON.stringify(fromAcct)} ${JSON.stringify(toAcct)} (read-keyset "recp-ks") ${formatAmount(amount)})`,
        networkId: NETWORK_ID,
        keyPairs: [{
          //EXCHANGE ACCOUNT KEYS
          //  PLEASE KEEP SAFE
          publicKey: PUB_KEY,
          secretKey: PRIV_KEY,
          clist: [
            //capability to transfer
            {
              name: `${tokenAddress}.TRANSFER`,
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
    const pollRes = await pollTxRes(reqKey, host(chainId));
    if (pollRes.result.status === 'success') {
      return `TRANSFER SUCCESS: from ${fromAcct} to ${toAcct} for ${amount} ${tokenAddress} on chain ${chainId}`
    } else {
      return "CANNOT PROCESS TRANSFER: invalid blockchain tx"
    }
  } catch (e) {
    console.log(e);
    return "CANNOT PROCESS TRANSFER: network error"
  }
}

const transferCrossChainSameAccount = async (
  tokenAddress,
  account,
  amount,
  fromChain,
  toChain
) => {
  try {
    const burn = await Pact.fetch.send(
      {
        pactCode: `(${tokenAddress}.transfer-crosschain ${JSON.stringify(account)} ${JSON.stringify(account)} (read-keyset "own-ks") ${JSON.stringify(toChain)} ${formatAmount(amount)})`,
        networkId: NETWORK_ID,
        keyPairs: [{
          //EXCHANGE ACCOUNT KEYS
          //  PLEASE KEEP SAFE
          publicKey: PUB_KEY,
          secretKey: PRIV_KEY,
          clist: []
        }],
        meta: Pact.lang.mkMeta(account, fromChain, GAS_PRICE, GAS_LIMIT, creationTime(), TTL),
        envData: {
          "own-ks": {"pred":"keys-all","keys":[PUB_KEY]}
        },
      },
      host(fromChain)
    )
    const reqKey = burn.requestKeys[0]
    const pollRes = await pollTxRes(reqKey, host(fromChain));
    if (pollRes.result.status === 'success') {
      const pactId = pollRes.continuation.pactId;
      const targetChainId = pollRes.continuation.yield.provenance.targetChainId;
      const spvCmd = {"targetChainId": targetChainId, "requestKey": pactId };
      let proof;
      while (!proof) {
        const spvRes = await Pact.fetch.spv(spvCmd, host(fromChain));
        if (spvRes !== 'SPV target not reachable: target chain not reachable. Chainweb instance is too young') {
          proof = spvRes
        }
        await sleepPromise(5000);
      }
      const meta = Pact.lang.mkMeta("free-x-chain-gas", toChain, GAS_PRICE, 300, creationTime(), TTL);
      // const contCmd = {type: "cont", keyPairs:[], pactId: pactId, rollback: false, step: 1, meta: m, proof: proof, networkId: NETWORK_ID};
      // const cmd = Pact.simple.cont.createCommand( contCmd.keyPairs, contCmd.nonce, contCmd.step, contCmd.pactId,
      //                                                     contCmd.rollback, contCmd.envData, contCmd.meta, contCmd.proof, contCmd.networkId);
      const continuationCommand = makePactContCommand(toChain, reqKey, proof, 1, meta, NETWORK_ID);
      const mint = await Pact.fetch.send(continuationCommand, host(toChain))
      const mintReqKey = mint.requestKeys[0]
      const mintPollRes = await pollTxRes(mintReqKey, host(toChain));
      if (mintPollRes.result.status === 'success') {
        return `CROSS-CHAIN TRANSFER SUCCESS: ${amount} ${tokenAddress} transfered from chain ${fromChain} to ${toChain} for account ${account}`
      } else {
        //funds were burned on fromChain but not minted on toChain
        //visit https://transfer.chainweb.com/xchain.html and approve the mint with the reqKey
        return `PARTIAL CROSS-CHAIN TRANSFER: funds burned on chain ${fromChain} with reqKey ${reqKey} please mint on chain ${toChain}`
      }
    } else {
      //burn did not work
      return `CANNOT PROCESS CROSS-CHAIN TRANSFER: cannot send from origin chain ${fromChain}`
    }
  } catch (e) {
    console.log(e)
    return "CANNOT PROCESS CROSS-CHAIN TRANSFER: network error"
  }
}

const balanceFunds = async (
  tokenAddress,
  account,
  amountRequested,
  amountAvailable,
  chainId
) => {
  try {
    let chainBalances = {};
    for (let i = 0; i < 20; i++) {
      if (i.toString() === chainId) continue;
      let details = await getAcctDetails(tokenAddress, account, i.toString());
      chainBalances[i.toString()] = details.balance
    }
    var sorted = [];
    for (var cid in chainBalances) {
      sorted.push([cid, chainBalances[cid]])
    }
    sorted.sort(function(a, b) {
      return b[1] - a[1];
    });
    var total = 0;
    var transfers = [];
    const amountNeeded = amountRequested - amountAvailable;
    for (let i = 0; i < sorted.length; i++) {
      var halfBal = sorted[i][1] / 2;
      transfers.push([sorted[i][0], halfBal]);
      total = total + halfBal
      if (total > amountNeeded) break;
    }
    for (let i = 0; i < transfers.length; i++) {
      await transferCrossChainSameAccount('coin', PUB_KEY, transfers[i][1], transfers[i][0], chainId)
    }
    return `BALANCE FUNDS SUCCESS`
  } catch (e) {
    console.log(e);
    return "CANNOT PROCESS BALANCE FUNDS: network error"
  }
}

module.exports = {
  transfer,
  balanceFunds
}
