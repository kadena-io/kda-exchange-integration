const chainweb = require('../chain-data/chainweb');
var {
  getDecimal
} = require('../util/blockchain-helpers.js')

/**
 * Gets all transfers (same and cross chain) on a given chain for a given blockheight range
 * @param tokenAddress {string} - this is the address of the token kda token is 'coin'
 *                                  an abritrary token example is 'runonflux.flux' for flux token deployed on our network
 * @param chainId {string} - this is the chain you are listening for transfers on
 * @param startBlock {int} - block height to start looking
 * @param endBlock {int} - block height to end looking
 * @return {array[obj]} in this format
    [
     {
       from: 'd250a56932b4407c0630e03feb4a126ad5d3bd2f754b424847b32c665f69fb1a',
       to: '394a97e0c49e38104972e74d63f12dd9841d19a32deb4efc96fdafa4000f61f6',
       amount: 1250,
       type: 'same-chain',
       height: 1615481,
       reqKey: '7CaYXYHKaP7xkZYsyWLkOZ9M7jTjjJo116DL0F4N51c'
     },
     {
       from: '9dfdf6d27f05ecea60c8a98311755ad93f91659e0c0e29402aabb0131ed78da7',
       to: '9dfdf6d27f05ecea60c8a98311755ad93f91659e0c0e29402aabb0131ed78da7',
       height: 1615481,
       amount: 6,
       type: 'cross-chain',
       reqKey: 'p3cWibImAgUlIiR_7wBVRNBtfYuUn5_7HiNldMQXYIQ'
     },
     ...,
   ]
**/
const getTransfers = async (tokenAddress, chainId, startBlock, endBlock) => {
  let txs = await chainweb.transactions.range(chainId, startBlock, endBlock);
  const transfers = [];
  for (let i = 0; i < txs.length; i++) {
    if (txs[i].output.result.status === "success") {
      let events = txs[i].output.events;
      if (events) {
        //check if tx has transfer events
        for (let j = 0; j < events.length; j++) {
          if (events[j].name === "TRANSFER" && events[j].module.name === tokenAddress) {
            transfers.push(
              {
                "from": events[j].params[0],
                "to": events[j].params[1],
                "amount": getDecimal(events[j].params[2]),
                "type": "same-chain",
                "height": txs[i].height,
                "reqKey": txs[i].output.reqKey
              }
            )
          }
        }
      } else {
        //not a direct transfer
        if (txs[i].output.continuation) {
          if (txs[i].output.continuation.continuation.def === `${tokenAddress}.transfer-crosschain`) {
            transfers.push(
              {
                "from": txs[i].output.continuation.continuation.args[0],
                "to": txs[i].output.continuation.continuation.args[1],
                "height": txs[i].height,
                "amount": getDecimal(txs[i].output.continuation.continuation.args[4]),
                "type": "cross-chain",
                "reqKey": txs[i].output.reqKey
              }
            )
          } else {
            //not cross-chain transfer
            continue
          }
        } else {
          //not a pact continution, so not a cross-chain transfer
          continue
        }
      }
    } else {
      //failed tx
      continue;
    }
  }
  console.log(transfers)
  return transfers
}


getTransfers('coin', 0, 1615447, 1615482)
