//------------------------------------------------------------------------------------------------------------------------
//                  NETWORK CONSTS
//------------------------------------------------------------------------------------------------------------------------

//UNCOMMENT TWO CONSTS FOR MAINNET
// const NETWORK_ID = 'mainnet01';
// const SERVER = 'api.chainweb.com';

//COMMENT OUT FOR MAINNET
const NETWORK_ID = 'testnet04';
const SERVER = 'api.testnet.chainweb.com';
//
//
const TTL = 28800;
const GAS_PRICE = 0.0000000001;
const GAS_LIMIT = 10000;
const creationTime = () => Math.round((new Date).getTime()/1000)-15
const host = (chainId) => `https://${SERVER}/chainweb/0.0/${NETWORK_ID}/chain/${chainId}/pact`

module.exports = {
  NETWORK_ID,
  SERVER,
  TTL,
  GAS_PRICE,
  GAS_LIMIT,
  creationTime,
  host
}
