var {
  checkKey,
  formatAmount
} = require('./format-helpers.js')

const getAcctDetails = async (
    acct,
    chainId
) => {
  try {
    //this function only READS from the blockchain
    let data = await Pact.fetch.local({
        pactCode: `(coin.details ${JSON.stringify(acct)})`,
        keyPairs: Pact.crypto.genKeyPair(),
        meta: Pact.lang.mkMeta("", chainId, gasPrice, gasLimit, ttl, creationTime),
    }, host(chainId));
    if (data.result.status === "success"){
      //account exists
      //return {account: string, guard:obj, balance: decimal}
      return data.result.data
    } else {
      //account does not exist
      return { account: null, guard: null, balance: 0 }
    }
  } catch (e) {
    //most likely a formatting or rate limiting error
    console.log(e)
    return "CANNOT FETCH ACCOUNT: network error"
  }
}

module.exports = {
  getAcctDetails
}
