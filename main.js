var {
  checkKey,
} = require('./util/format-helpers.js')
var {
  getAcctDetails,
} = require('./util/blockchain-read.js')
var {
  transfer,
  balanceFunds
} = require('./util/blockchain-write.js')
var {
  PUB_KEY
} = require('./var/keys.js')

const processWithdraw = async (
    tokenAddress,
    fromAcct,
    toAcct,
    amount,
    chainId
  ) => {
    try {
      var ownDetails = await getAcctDetails(tokenAddress, PUB_KEY, chainId);
      if (ownDetails.balance < amount) {
        //not enough funds on PUB_KEY account on this chain
        //wait for funds to be transferred from own account on other chains
        const fundedXChain = await balanceFunds(tokenAddress, PUB_KEY, amount, ownDetails.balance, chainId);
        if (fundedXChain !== "BALANCE FUNDS SUCCESS") {
          //was not able to move funds across different chains
          return `CANNOT PROCESS WITHDRAW: not enough funds on chain ${chainId}`
        }
      }
      //check if toAcct exists on specified chain
      const details = await getAcctDetails(tokenAddress, toAcct, chainId);
      if (details.account !== null) {
          //account exists on chain
          if (checkKey(toAcct) && toAcct !== details.guard.keys[0]) {
            //account is a public key account
            //but the public key guard does not match account name public key
            //EXIT function
            return "CANNOT PROCESS WITHDRAW: non-matching public keys"
          } else {
            //send to this account with this guard
            const res = await transfer(tokenAddress, PUB_KEY, toAcct, amount, chainId, details.guard)
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
          const res = await transfer(tokenAddress, PUB_KEY, toAcct, amount, chainId, {"pred":"keys-all","keys":[toAcct]})
          return res
        } else {
          //toAcct is totally invalid
          //EXIT function
          return "CANNOT PROCESS WITHDRAW: new account not a public key"
        }
      }
    } catch (e) {
      //most likely a formatting or rate limiting error
      console.log(e)
      return "CANNOT PROCESS WITHDRAW: network error"
    }
}

//EXAMPLE FUNCTION CALL
// processWithdraw('coin', PUB_KEY, 'account-sending-to-pub-key-or-name', 0.01, "10");

module.exports = {
  processWithdraw
}
