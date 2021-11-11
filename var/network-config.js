//------------------------------------------------------------------------------------------------------------------------
//                  NETWORK CONSTS
//------------------------------------------------------------------------------------------------------------------------

//UNCOMMENT TWO CONSTS FOR MAINNET
//const NETWORK_ID = 'mainnet01';
////SHOULD REPLACE URL WITH OWN NODE IP:PORT
//const SERVER = 'api.chainweb.com';

//COMMENT OUT FOR MAINNET
const NETWORK_ID = 'testnet04';
const SERVER = 'api.testnet.chainweb.com';

const TTL = 28800;
const GAS_PRICE = 0.00000001
const GAS_LIMIT = 10000;
const HIGH_GAS_LIMIT = 60000;
const HIGH_GAS_PRICE = 0.000001;

// This parameter is subject to change in the future
const GAS_STATION_ACCOUNT = "free-x-chain-gas"
const creationTime = () => Math.round((new Date).getTime()/1000)-15
const host = (chainId) => `https://${SERVER}/chainweb/0.0/${NETWORK_ID}/chain/${chainId}/pact`

module.exports = {
  NETWORK_ID,
  SERVER,
  TTL,
  GAS_PRICE,
  GAS_LIMIT,
  HIGH_GAS_LIMIT,
  HIGH_GAS_PRICE,
  GAS_STATION_ACCOUNT,
  creationTime,
  host
}
