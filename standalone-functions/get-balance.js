var {
  getAcctDetails
} = require('../util/blockchain-read.js')


/**
 * get balance of address on all 20 chains
 * @param tokenAddress {string} - this is the address of the token kda token is 'coin'
 *                                  an abritrary token example is 'runonflux.flux' for flux token deployed on our network
 * @param userAddress {string} - address of account you would like to create (this is usually a public key)
 * @return {object} object with chain id and corresponding balance. will use "N/A" as balance if account does not exist on a given chain
 *  format: {"chainId": balance, ...} ex: {"0": 123, ..., "19": 123}
**/
const getBalance = async (
  tokenAddress,
  userAddress
) => {
  try {
    //get balance for all 20 chains
    balances = {};
    for (let i = 0; i < 20; i++) {
      const chainId = i.toString();
      const acctDetails = await getAcctDetails(tokenAddress, userAddress, chainId);
      if (acctDetails.account) {
        balances[chainId] = acctDetails.balance
      } else {
        balances[chainId] = "N/A"
      }
    }
    return balances
  } catch (e) {
    console.log(e);
    return "GET BALANCE FAILED: NETWORK ERROR"
  }
}

//EXAMPLE CALL
getBalance('coin', '70c67dabe9a54d1970461de00009f074e2ea22589dab553d159b6e1e93ae7e27')
