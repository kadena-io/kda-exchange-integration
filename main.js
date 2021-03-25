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
  PUB_KEY,
  PRIV_KEY
} = require('./var/keys.js')

const processWithdraw = async (
    tokenAddress,
    fromAcct,
    fromAcctPrivKey,
    toAcct,
    amount,
    chainId
  ) => {
    console.log('1')
    try {
      var ownDetails = await getAcctDetails(tokenAddress, fromAcct, chainId);
      if (ownDetails.balance < amount) {
        //not enough funds on PUB_KEY account on this chain
        //wait for funds to be transferred from own account on other chains
        console.log('2')
        const fundedXChain = await balanceFunds(tokenAddress, fromAcct, fromAcctPrivKey, amount, ownDetails.balance, chainId);
        if (fundedXChain !== "BALANCE FUNDS SUCCESS") {
          //was not able to move funds across different chains
          return `CANNOT PROCESS WITHDRAW: not enough funds on chain ${chainId}`
        }
      }
      //check if toAcct exists on specified chain
      const details = await getAcctDetails(tokenAddress, toAcct, chainId);
      if (details.account !== null) {
        console.log('3')
          //account exists on chain
          if (checkKey(toAcct) && toAcct !== details.guard.keys[0]) {
            console.log('4')
            //account is a public key account
            //but the public key guard does not match account name public key
            //EXIT function
            return "CANNOT PROCESS WITHDRAW: non-matching public keys"
          } else {
            console.log('5')
            //send to this account with this guard
            const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, chainId, details.guard)
            return res
          }
      } else if (details === "CANNOT FETCH ACCOUNT: network error") {
        console.log('6')
        //account fetch failed
        //EXIT function
        return "CANNOT PROCESS WITHDRAW: account not fetched"
      } else {
        console.log('7')
        //toAcct does not yet exist
        if (checkKey(toAcct)) {
          //toAcct does not exist, but is a valid address

          // NOTE An exchange might want to ask the user to confirm that they
          // own the private key corresponding to this public key.

          //send to this
          const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, chainId, {"pred":"keys-all","keys":[toAcct]})
          return res
        } else {
          console.log('8')
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
processWithdraw('coin', PUB_KEY, PRIV_KEY, '9be19442151c880492ec0fddc5bdbe9eccd243b8d723f4673b317f10b2e5d515', 0.51, "10");

module.exports = {
  processWithdraw
}
