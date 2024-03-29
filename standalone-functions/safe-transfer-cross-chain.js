var {
  checkKey,
} = require('../util/format-helpers.js')
var {
  getAcctDetails,
} = require('../util/blockchain-read.js')
var {
  transfer,
  balanceFunds
} = require('../util/blockchain-write.js')
var {
  K_ACCOUNT,
  PUB_KEY,
  PRIV_KEY
} = require('../var/keys.js')

/**
 * Sends funds from any chain to target chain (funds will automatically be rebalanced to make this possible)
 ** NOTE: Kadena accounts can be arbitrary strings, but k-style accounts are required in this function to avoid confusion
 ***      This will ONLY allow transfers to k-style format accounts, though it will allow arbitrary guards for these k-style
          accounts, to allow transfers to multisig accounts with a k-style name
 * @param tokenAddress {string} - this is the address of the token kda token is 'coin'
 *                                  an abritrary token example is 'runonflux.flux' for flux token deployed on our network
 * @param fromAcct {string} - account name of the sending account
 * @param fromAcctPrivKey {string} - private key of sending account
 * @param toAcct {string} - account name of the receiving account; must be k-style
 * @param amount {decimal} - amount to transfer
 * @param targetChainId {decimal} - chain id of the target chain for the transfer
 * @return {string} success or failure with message
**/
const safeTransferCrossChain = async (
    tokenAddress,
    fromAcct,
    fromAcctPrivKey,
    toAcct,
    amount,
    targetChainId
  ) => {
    try {
      const ownDetails = await getAcctDetails(tokenAddress, fromAcct, targetChainId);
      if (ownDetails.balance < amount) {
        //not enough funds on K_ACCOUNT account on this chain
        //wait for funds to be transferred from own account on other chains
        const fundedXChain = await balanceFunds(tokenAddress, fromAcct, fromAcctPrivKey, amount, ownDetails.balance, targetChainId);
        if (fundedXChain !== "BALANCE FUNDS SUCCESS") {
          //was not able to move funds across different chains
          return `CANNOT PROCESS TRANSFER: not enough funds on chain ${targetChainId}`
        }
      }
      if (!checkKAccount(toAcct))
        //destination address not a k-style account
        return `CANNOT PROCESS TRANSFER: destination account not k-style: ${toAcct}`
      }

      //check if toAcct exists on specified chain
      const details = await getAcctDetails(tokenAddress, toAcct, targetChainId);
      if (details.account !== null) {
        //account exists on chain
        //send to this account with this guard
        const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, targetChainId, details.guard)
        return res
      } else if (details === "CANNOT FETCH ACCOUNT: network error") {
        //account fetch failed
        //EXIT function
        return "CANNOT PROCESS TRANSFER: account not fetched"
      } else {
        //toAcct does not yet exist
        const destinationPublicKey = extractPubKeyFromKAccount(toAcct)
        if (destinationPublicKey) {
          //toAcct does not exist, but is a valid k-style account

          // NOTE An exchange might want to ask the user to confirm that they
          // own the private key corresponding to this public key.

          //send to this
          const res = await transfer(tokenAddress, fromAcct, fromAcctPrivKey, toAcct, amount, targetChainId, {"pred":"keys-all","keys":[destinationPublicKey]})
          return res
        } else {
          //toAcct is totally invalid
          //EXIT function
          return "CANNOT PROCESS TRANSFER: new account not a k-style account"
        }
      }
    } catch (e) {
      //most likely a formatting or rate limiting error
      console.log(e)
      return "CANNOT PROCESS TRANSFER: network error"
    }
}

//EXAMPLE FUNCTION CALL
safeTransferCrossChain('coin', K_ACCOUNT, PRIV_KEY, 'k:9be19442151c880492ec0fddc5bdbe9eccd243b8d723f4673b317f10b2e5d515', 0.01, "11");
