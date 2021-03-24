var {
  getAcctDetails
} = require('../util/blockchain-read.js')

//get balance of publicKey address
// format {"0": 123, ..., "19": 123}
//  will use "N/A as a balance if account does not exist on a given chain"
const getBalance = async (
  tokenAddress,
  publicKey
) => {
  try {
    //get balance for all 20 chains
    balances = {};
    for (let i = 0; i < 20; i++) {
      const chainId = i.toString();
      const acctDetails = await getAcctDetails(tokenAddress, publicKey, chainId);
      console.log(acctDetails)
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
// getBalance('coin', '70c67dabe9a54d1970461de00009f074e2ea22589dab553d159b6e1e93ae7e27')
