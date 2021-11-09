var {
  checkKey,
  checkKAccount,
  extractPubKeyFromKAccount
} = require('../util/format-helpers.js')
var {
  getAcctDetails,
} = require('../util/blockchain-read.js')
var {
  transfer,
  balanceFunds
} = require('../util/blockchain-write.js')
var {
  PUB_KEY,
  PRIV_KEY
} = require('../var/keys.js')

/**
 * Sends funds ONLY on specified chain
 ** NOTE: Kadena accounts can be arbitrary strings, but public key format is prefered to avoid confusion
 ***      this will allow transfer to arbitry accounts if the account exists on chain
 ****       and allow transfer to ONLY public key format account if the account does not yet exist on chain
 * @param tokenAddress {string} - this is the address of the token kda token is 'coin'
 *                                  an abritrary token example is 'runonflux.flux' for flux token deployed on our network
 * @param fromAcct {string} - account name of the sending account
 * @param fromAcctPrivKey {string} - private key of sending account
 * @param toAcct {string} - account name of the receiving account
 * @param amount {decimal} - amount to transfer
 * @param chainId {decimal} - chain id the transfer will happen on
 * @return {string} success or failure with message
**/
const safeTransfer = async (
    tokenAddress,
    fromAcct,
    fromAcctPrivKey,
    toAcct,
    amount,
    chainId
  ) => {
    try {
      var fromDetails = await getAcctDetails(tokenAddress, fromAcct, chainId);
      if (!fromDetails.account) {
        //not enough funds on fromAcct account on this chain
        return `CANNOT PROCESS TRANSFER: ${fromAcct} does not exist on chain ${chainId}`
      }
      if (fromDetails.balance < amount) {
        //not enough funds on fromAcct account on this chain
        return `CANNOT PROCESS TRANSFER: not enough funds on chain ${chainId}`
      }
      //check if toAcct exists on specified chain
      const details = await getAcctDetails(tokenAddress, toAcct, chainId);
      if (details.account !== null) {
          //account exists on chain
          if (checkKey(toAcct) && toAcct !== details.guard.keys[0]) {
            //account is a public key account
            //but the public key guard does not match account name public key
            //EXIT function
            return "CANNOT PROCESS TRANSFER: non-matching public keys"
          } else {
            //send to this account with this guard
            const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, chainId, details.guard)
            return res
          }
      } else if (details === "CANNOT FETCH ACCOUNT: network error") {
        //account fetch failed
        //EXIT function
        return "CANNOT PROCESS TRANSFER: account not fetched"
      } else {
        //toAcct does not yet exist
        if (checkKAccount(toAcct)) {
          //toAcct does not exist, but is a valid k-account

          // NOTE An exchange might want to ask the user to confirm that they
          // own the private key corresponding to this public key.

          const toActPubKey = extractPubKeyFromKAccount(toAcct);
          if(!toActPubKey) {
            // in theory, this should never happen because we called checkKAccount above
            return "CANNOT PROCESS TRANSFER: failed to extract pubkey from k-account"
          }
          const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, chainId, {"pred":"keys-all","keys":[toActPubKey]})
          return res

        } else if (checkKey(toAcct)) {
          //toAcct does not exist, but is a valid public-key/legacy address

          // NOTE An exchange might want to ask the user to confirm that they
          // own the private key corresponding to this public key.

          //send to this
          const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, chainId, {"pred":"keys-all","keys":[toAcct]})
          return res
        } else {
          //toAcct is totally invalid
          //EXIT function
          return "CANNOT PROCESS TRANSFER: new account not a public key"
        }
      }
    } catch (e) {
      //most likely a formatting or rate limiting error
      console.log(e)
      return "CANNOT PROCESS TRANSFER: network error"
    }
}

//EXAMPLE FUNCTION CALL
safeTransfer('coin', PUB_KEY, PRIV_KEY, '9be19442151c880492ec0fddc5bdbe9eccd243b8d723f4673b317f10b2e5d515', 0.01, "1");
