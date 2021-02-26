//------------------------------------------------------------------------------------------------------------------------
//                  NETWORK CONSTS
//------------------------------------------------------------------------------------------------------------------------
// const NETWORK_ID = 'mainnet01';
// const SERVER = 'api.chainweb.com';
export const NETWORK_ID = 'testnet04';
export const SERVER = 'api.testnet.chainweb.com';
export const TTL = 28800;
export const GAS_PRICE = 0.0000000001;
export const GAS_LIMIT = 1000;
export const creationTime = () => Math.round((new Date).getTime()/1000)-15
export const host = (chainId) => `https://${SERVER}/chainweb/0.0/${NETWORK_ID}/chain/${chainId}/pact`
