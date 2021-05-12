const chainweb = require('../chain-data/chainweb');
var {
  getDecimal
} = require('../util/blockchain-helpers.js')

const getTransfers = async (chainId, startBlock, endBlock) => {
  let txs = await chainweb.transactions.range(chainId, startBlock, endBlock);
  const sameChainTransfers = [];
  const crossChainTransfers = [];
  for (let i = 0; i < txs.length; i++) {
    if (txs[i].output.result.status === "success") {
      let events = txs[i].output.events;
      if (events) {
        //check if tx has transfer events
        for (let j = 0; j < events.length; j++) {
          if (events[j].name === "TRANSFER") {
            sameChainTransfers.push(
              {
                "from": events[j].params[0],
                "to": events[j].params[1],
                "amount": getDecimal(events[j].params[2]),
                "type": "same-chain",
                "reqKey": txs[i].output.reqKey
              }
            )
          }
        }
      } else {
        //not a direct transfer
        if (txs[i].output.continuation) {
          if (txs[i].output.continuation.continuation.def === 'coin.transfer-crosschain') {
            crossChainTransfers.push(
              {
                "from": txs[i].output.continuation.continuation.args[0],
                "to": txs[i].output.continuation.continuation.args[1],
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
          //not a cross-chain transfer
          continue
        }
      }
    } else {
      //failed tx
      continue;
    }
  }
  console.log(sameChainTransfers)
  console.log(crossChainTransfers)
  return {
    sameChainTransfers,
    crossChainTransfers
  }
}

//all transfers happened on chain 1
//from block 1613200 to block 1613308
getTransfers(1, 1613200, 1613308)
