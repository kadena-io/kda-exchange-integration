var {
  checkKey,
} = require('./util/format-helpers.js')
var {
  getAcctDetails,
} = require('./util/blockchain-read.js')
var {
  transfer,
  transferCrossChain
} = require('./util/blockchain-write.js')

const processWithdraw = async (
    fromAcct,
    toAcct,
    amount,
    chainId
  ) => {
    try {
      //check if toAcct exists on blockchain on this specified chain
      var details = await getAcctDetails(toAcct, chainId);
      if (details.account !== null) {
          //account exists on chain
          if (checkKey(toAcct) && toAcct !== details.guard.keys[0]) {
            //account is a public key account
            //but the public key guard does not match account name public key
            //EXIT function
            return "CANNOT PROCESS WITHDRAW: non-matching public keys"
          } else {
            //send to this account with this guard
            const res = await transfer(PUB_KEY, toAcct, amount, chainId, details.guard)
            return res
          }
      } else if (details === "CANNOT FETCH ACCOUNT: network error") {
        //account fetch failed
        //EXIT function
        return "CANNOT PROCESS WITHDRAW: account not fetched"
      } else {
        //toAcct does not yet exist
        if (checkKey(toAcct)) {
          //toAcct does not exist, but is a valid address
          //send to this
          const res = await transfer(PUB_KEY, toAcct, amount, chainId, {"pred":"keys-all","keys":[toAcct]})
          return res
        } else {
          //toAcct is totally invalid
          //EXIT function
          return "CANNOT PROCESS WITHDRAW: invalid new account"
        }
      }
    } catch (e) {
      //most likely a formatting or rate limiting error
      console.log(e)
      return "CANNOT PROCESS WITHDRAW: network error"
    }
}
