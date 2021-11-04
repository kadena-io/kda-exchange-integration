var {
  extractPubKeyFromKAccount,
  checkKAccount
} = require('../util/format-helpers.js')
var {
  getAcctDetails,
} = require('../util/blockchain-read.js')
var {
  transfer
} = require('../util/blockchain-write.js')
var {
  K_ACCOUNT,
  PUB_KEY,
  PRIV_KEY
} = require('../var/keys.js')

/**
 * Sends funds ONLY on specified chain
 ** NOTE: Kadena accounts can be arbitrary strings, but k-style accounts are required in this function to avoid confusion
 ***      This will ONLY allow transfers to k-style format accounts, though it will allow arbitrary guards for these k-style
          accounts, to allow transfers to multisig accounts with a k-style name
 * @param tokenAddress {string} - this is the address of the token kda token is 'coin'
 *                                  an abritrary token example is 'runonflux.flux' for flux token deployed on our network
 * @param fromAcct {string} - account name of the sending account
 * @param fromAcctPrivKey {string} - private key of sending account
 * @param toAcct {string} - account name of the receiving account; must be a k-style account
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
      if (!checkKAccount(toAcct))
        //destination address not a k-style account
        return `CANNOT PROCESS TRANSFER: destination account not k-style: ${toAcct}`
      }
      //check if toAcct exists on specified chain
      const details = await getAcctDetails(tokenAddress, toAcct, chainId);
      if (details.account !== null) {
          //k-account exists on chain
          //send to this account with its already existing guard
          const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, chainId, details.guard)
          return res;
      } else if (details === "CANNOT FETCH ACCOUNT: network error") {
        //account fetch failed
        //EXIT function
        return "CANNOT PROCESS TRANSFER: account not fetched"
      } else {
        //toAcct does not yet exist, but is k-style account name
        // NOTE An exchange might want to ask the user to confirm that they
        // own the private key corresponding to this public key.
        const pubKey = extractPubKeyFromKAccount(toAcct)
        if(!pubKey) {
          // Extraction failed; In theory this shouldnt happen since we already checked the
          // k-account is valid, but better to check just in case
          return "CANNOT PROCESS TRANSFER: public key not extracted from address" 
        }
        //send to this
        const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, chainId, {"pred":"keys-all","keys":[pubKey]})
        return res
      }
    } catch (e) {
      //most likely a formatting or rate limiting error
      console.log(e)
      return "CANNOT PROCESS TRANSFER: network error"
    }
}

//EXAMPLE FUNCTION CALL
if ((extractPubKeyFromKAccount(K_ACCOUNT) == PUB_KEY) && PUB_KEY == getPubFromPriv(PRIV_KEY)) {
  safeTransfer('coin', K_ACCOUNT, PRIV_KEY, 'k:9be19442151c880492ec0fddc5bdbe9eccd243b8d723f4673b317f10b2e5d515', 0.01, "1");
} else {
  console.log("TRANSFER FAILED: Sending account not owned by private key")
}
