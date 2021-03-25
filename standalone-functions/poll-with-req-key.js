var {
  host
} = require('../var/network-config.js')
var {
  pollTxRes
} = require('../util/blockchain-helpers.js')

/**
 * Polls blockchain for transaction status
 * @param reqKey {string} - this is the transaction hash. Returned when doing a 'send' call to blockchain
 * @param chainId {string} - chain that transaction is on
 * @return {object} transaction status object
 *  ex format:
       {
         gas: 559,
         result: { status: 'success', data: 'Write succeeded' },
         reqKey: 'llFl8N8bSoCcLPeI8UZOnxieT-iwXu_7PWluPAn-R5s',
         logs: 'sl1JKzt6DJk-xKJRTxDKwuT_IBMNfxZ9PyWCw4XmWF4',
         events: [
           {
             params: [Array],
             name: 'TRANSFER',
             module: [Object],
             moduleHash: 'ut_J_ZNkoyaPUEJhiwVeWnkSQn9JT9sQCWKdjjVVrWo'
           }
         ],
         metaData: {
           blockTime: 1616710917020360,
           prevBlockHash: 'SdlxPjKHoG2ixVIiy2TS-s1QrJ_uiOeGoMWW-x-mmyU',
           blockHash: '_KAM2rzTFVj8gUVLu0MuPjR53svGl5avYxcO1l32HnA',
           blockHeight: 1020089
         },
         continuation: null,
         txId: 1021121
       }
**/
const getTxStatus = async (
  reqKey,
  chainId
) => {
    const pollResult = await pollTxRes(reqKey, host(chainId));
    console.log(pollResult);
    return pollResult
}

getTxStatus('llFl8N8bSoCcLPeI2UZOnxieT-iwXu_7PWluPAn-R5s', '1')
