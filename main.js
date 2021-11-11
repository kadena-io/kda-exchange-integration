var {
  checkKey,
  checkKAccount,
  extractPubKeyFromKAccount
} = require('./util/format-helpers.js')
var {
  getAcctDetails,
} = require('./util/blockchain-read.js')
var {
  transfer,
  balanceFunds
} = require('./util/blockchain-write.js')

const processWithdraw = async (
    tokenAddress,
    fromAcct,
    fromAcctPrivKey,
    toAcct,
    amount,
    chainId
  ) => {
    try {
      var ownDetails = await getAcctDetails(tokenAddress, fromAcct, chainId);
      if (ownDetails.balance < amount) {
        //not enough funds on KACCOUNT account on this chain
        //wait for funds to be transferred from own account on other chains
        const fundedXChain = await balanceFunds(tokenAddress, fromAcct, fromAcctPrivKey, amount, ownDetails.balance, chainId);
        if (fundedXChain !== "BALANCE FUNDS SUCCESS") {
          //was not able to move funds across different chains
          return `CANNOT PROCESS WITHDRAW: not enough funds on chain ${chainId}`
        }
      }

      //check if toAcct exists on specified chain
      const details = await getAcctDetails(tokenAddress, toAcct, chainId);
      if (details.account !== null) {
          //account exists on chain

           // Reject all accounts that either don't conform to k-standard. Note this will not reject
           // k-style accounts whose guards have been rotated for a multisig
          if (!checkKAccount(toAcct)) {
            //EXIT function
            return "CANNOT PROCESS WITHDRAW: account does not conform to k-standard or has rotated keyset"
          } else {
            //send to this account with this guard
            const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, chainId, details.guard)
            return res
          }
      } else if (details === "CANNOT FETCH ACCOUNT: network error") {
        //account fetch failed
        //EXIT function
        return "CANNOT PROCESS WITHDRAW: account not fetched"
      } else {
        //toAcct does not yet exist
        if (checkKAccount(toAcct)) {
          //toAcct does not exist, but is a valid address

          // NOTE An exchange might want to ask the user to confirm that they
          // own the private key corresponding to this public key.
          const toAcctPubKey = extractPubKeyFromKAccount(toAcct);

          // This should never happen since we already checked it
          if(!toAcctPubKey) { return "CANNOT PROCESS WITHDRAW: account does not conform to k-standard" }

          //send to this
          const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, chainId, {"pred":"keys-all","keys":[toAcctPubKey]})
          return res
        } else {
          //toAcct is totally invalid
          //EXIT function
          return "CANNOT PROCESS WITHDRAW: account does not conform to k-standard"
        }
      }
    } catch (e) {
      //most likely a formatting or rate limiting error
      console.log(e)
      return "CANNOT PROCESS WITHDRAW: network error"
    }
}

//EXAMPLE FUNCTION CALL
// processWithdraw('coin', K_ACCOUNT, PRIV_KEY, 'k:9be19442151c880492ec0fddc5bdbe9eccd243b8d723f4673b317f10b2e5d515', 0.51, "10");

module.exports = {
  processWithdraw
}
