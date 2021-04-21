//WIP

// var Pact = require('pact-lang-api')
// var {
//   NETWORK_ID,
//   SERVER,
//   TTL,
//   GAS_LIMIT,
//   GAS_PRICE,
//   creationTime,
//   host
// } = require('../var/network-config.js')
// var {
//   checkKey,
//   formatAmountTwelve
// } = require('../util/format-helpers.js')
// var {
//   pollTxResWithTime,
//   getPubFromPriv
// } = require('../util/blockchain-helpers.js')
// var {
//   getAcctDetails
// } = require('../util/blockchain-read.js')
// var {
//   PUB_KEY,
//   PRIV_KEY
// } = require('../var/keys.js')
//
//
// /**
//  * Creates addresses for a given public key list
//  ** NOTE: to maintain safety of funds, please ensure the address is created on ALL 20 CHAINS
//  ***      this is a necessary precauction as people may 'squat' on accounts
//  * @param tokenAddress {string} - this is the address of the token kda token is 'coin'
//  *                                  an abritrary token example is 'runonflux.flux' for flux token deployed on our network
//  * @param emptiedAccount {string} - address / account name of account to be drained
//  * @param emptiedPrivKey {string} - private key of account to be drained
//  * @param receivingAccount {string} - address / account name of signing
//  * @param receivingPrivKey {string} - private key assosciated with receiving account (will sign for tx gas)
//  * @return {string} success or failure with message
// **/
// const emptyAccount = async (
//   tokenAddress,
//   emptiedAccount,
//   emptiedPrivKey,
//   receivingAccount,
//   receivingPrivKey
// ) => {
//   try {
//     const emptiedPubKey = getPubFromPriv(emptiedPrivKey);
//     const receivingPubKey = getPubFromPriv(receivingPrivKey);
//     let reqKeys = {};
//     for (i = 0; i < 1; i++) {
//       let chainId = i.toString()
//       const emptiedDetails = await getAcctDetails(tokenAddress, emptiedAccount, chainId);
//       const emptiedBalance = emptiedDetails.balance
//       console.log(emptiedBalance)
//       console.log(formatAmountTwelve(emptiedBalance))
//       const res = await Pact.fetch.send(
//         {
//           pactCode: `(${tokenAddress}.transfer ${JSON.stringify(emptiedAccount)} ${JSON.stringify(receivingAccount)} ${formatAmountTwelve(emptiedBalance)})`,
//           networkId: NETWORK_ID,
//           keyPairs: [{
//             //EXCHANGE ACCOUNT KEYS
//             //  PLEASE KEEP SAFE
//             publicKey: emptiedPubKey,
//             secretKey: emptiedPrivKey,
//             clist: [
//               //capability to transfer
//               {
//                 name: `${tokenAddress}.TRANSFER`,
//                 args: [emptiedAccount, receivingAccount, +formatAmountTwelve(emptiedBalance)]
//               },
//             ]
//           },
//           //RECEIVING ACCOUNT PAYS FOR THE GAS
//           {
//             publicKey: receivingPubKey,
//             secretKey: receivingPrivKey,
//             clist: [
//               //capability for gas
//               {
//                 name: `coin.GAS`,
//                 args: []
//               }
//             ]
//           }],
//           meta: Pact.lang.mkMeta(receivingAccount, chainId, GAS_PRICE, GAS_LIMIT, creationTime(), TTL),
//         },
//         host(chainId)
//       )
//       console.log(res)
//       reqKeys[chainId] = res.requestKeys[0]
//       // const pollRes = await pollTxRes(reqKey, host(chainId));
//     }
//     console.log(reqKeys)
//     // if (pollRes.result.status === 'success') {
//     //   return `TRANSFER SUCCESS: from ${fromAcct} to ${toAcct} for ${amount} ${tokenAddress} on chain ${chainId}`
//     // } else {
//     //   return "CANNOT PROCESS TRANSFER: invalid blockchain tx"
//     // }
//   } catch (e) {
//     console.log(e);
//     return "CANNOT PROCESS TRANSFER: network error"
//   }
// }
//
