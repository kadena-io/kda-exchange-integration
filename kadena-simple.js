import Pact from './pact-lang-api.js'

//------------------------------------------------------------------------------------------------------------------------
//                  START NETWORK CONSTS
//------------------------------------------------------------------------------------------------------------------------
  // const NETWORK_ID = 'mainnet01';
  // const SERVER = 'api.chainweb.com';
  const NETWORK_ID = 'testnet04';
  const SERVER = 'api.testnet.chainweb.com';
  const TTL = 28800;
  const GAS_PRICE = 0.0000000001;
  const GAS_LIMIT = 1000;
  const PUB_KEY = '70c67dabe9a54d1970461de00009f074e2ea22589dab553d159b6e1e93ae7e27'
  const PRIV_KEY = 'd817273c1d2ef7e2ababf8cfe0579bc1ffd2c36845684a3ae4b3275e215b2080'
  const creationTime = () => Math.round((new Date).getTime()/1000)-15
  const host = (chainId) => `https://${SERVER}/chainweb/0.0/${NETWORK_ID}/chain/${chainId}/pact`
//------------------------------------------------------------------------------------------------------------------------
//                  END NETWORK CONSTS
//------------------------------------------------------------------------------------------------------------------------


//------------------------------------------------------------------------------------------------------------------------
//                  START HELPERS
//------------------------------------------------------------------------------------------------------------------------

const isHexadecimal = (str) => {
  const regexp = /^[0-9a-fA-F]+$/;
  if (regexp.test(str)) return true;
  else return false;
};

const checkKey = (key) => {
  try {
    if (key.length !== 64) {
      return false;
    } else if (!isHexadecimal(key)) {
      return false;
    }
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

const formatAmount = (amount) => {
  //allowing max of 4 decimal places
  return (Math.floor(amount * 1e4) / 1e4).toFixed(4);
};

//------------------------------------------------------------------------------------------------------------------------
//                  END HELPERS
//------------------------------------------------------------------------------------------------------------------------


const getAcctDetails = async (
    acct,
    chainId
) => {
  try {
    //this function only READS from the blockchain
    let data = await Pact.fetch.local({
        pactCode: `(coin.details ${JSON.stringify(acct)})`,
        keyPairs: Pact.crypto.genKeyPair(),
        meta: Pact.lang.mkMeta("", chainId, gasPrice, gasLimit, ttl, creationTime),
    }, host(chainId));
    if (data.result.status === "success"){
      //account exists
      //{account: string, guard:obj, balance: decimal}
      return data.result.data
    } else {
      //account does not exist
      return { account: null, guard: null, balance: 0 }
    }
  } catch (e) {
    //most likely a formatting or rate limiting error
    console.log(e)
    return "CANNOT FETCH ACCOUNT: network error"
  }
}

//recipent is a public key or a txBuilder
//  toAcct -> "string" -> /local if exists, fetches those account detials.
//    If not, makes sure sure its a pub key, and if not it fails
const processWithdraw = async (
    fromAcct,
    toAcct,
    amount,
    chainId
  ) => {
    try {
      //check if toAcct exists on blockchain on this specified chain
      var details = await getAcctDetails(toAcct, chainId);
      if (details.account !== null) {
          //account exists on chain
          //send to this account with this guard
      } else if (details === "CANNOT FETCH ACCOUNT: network error") {
        //account fetch failed
        //EXIT function
        return "CANNOT PROCESS WITHDRAW: account not fetched"
      } else {
        //toAcct does not yet exist
        if (checkKey(toAcct)) {
          //toAcct does not exist, but is a valid address
          //send to this
        } else {
          //toAcct is totally invalid
          //EXIT function
          return "CANNOT PROCESS WITHDRAW: invalid new account"
        }
      }
    } catch (e) {
      //most likely a formatting or rate limiting error
      console.log(e)
      return "CANNOT PROCESS WITHDRAW: network error"
    }
}

const transfer = async (
  fromAcct,
  toAcct,
  amount,
  chainId,
  guard
) => {
  try {

  } catch (e) {
    console.log(e);
    return "CANNOT PROCESS TRANSFER: network error"
  }
}

const transferCrossChain = async (
  fromAcct,
  toAcct,
  amount,
  fromChainId,
  toChainId
) => {

}

export const sendFundsCrossChain = async (
  amount,
  fromChain,
  fromAddress,
  toChain,
  toAddress,
  toKeySet
) => {
  const crosschainTx = await fetchSend(
    makePactCommand(
      fromChain,
      `(coin.transfer-crosschain \
        "${fromAddress}" "${toAddress}" (read-keyset "account-keyset") "${toChain}" ${formatAmount(amount)})`,
      { "account-keyset": toKeySet }
    ),
    makeApiHost(fromChain)
  );
  wardTxResponseKeys(crosschainTx);

  const txResult = await pollCycle(crosschainTx, fromChain);

  const proof = await getProof(txResult.reqKey, fromChain, toChain);

  const continuationCommand = makePactContCommand(toChain, txResult.reqKey, proof, 1);
  if (useGasStation) {
    continuationCommand.meta.sender = "free-x-chain-gas";
    continuationCommand.meta.gasPrice = 1e-8;
    continuationCommand.meta.gasLimit = 400;
  }

  const result = await fetchSend(continuationCommand, makeApiHost(toChain));
  wardTxResponseKeys(result);

  return result.requestKeys[0];
};

export const sendFundsSameChain = async (
  amount: number,
  chainId: number,
  fromAddress: string,
  toAddress: string,
  toKeySet?: KeySet
) => {
  const cmd = toKeySet
    ? makePactCommand(
        chainId,
        `(coin.transfer-create "${fromAddress}" "${toAddress}" (read-keyset "account-keyset") ${formatAmount(amount)})`,
        { "account-keyset": toKeySet },
        [
          Pact.lang.mkCap("sender", "sender", "coin.TRANSFER", [fromAddress, toAddress, +formatAmount(amount)]).cap,
          Pact.lang.mkCap("gas-payer", "gas-payer", "coin.GAS").cap,
        ]
      )
    : makePactCommand(chainId, `(coin.transfer "${fromAddress}" "${toAddress}" ${formatAmount(amount)})`, undefined, [
        Pact.lang.mkCap("sender", "sender", "coin.TRANSFER", [fromAddress, toAddress, +formatAmount(amount)]).cap,
        Pact.lang.mkCap("gas-payer", "gas-payer", "coin.GAS").cap,
      ]);
  const result = await fetchSend(cmd, makeApiHost(chainId));
  wardTxResponseKeys(result);

  return result.requestKeys[0];
};
