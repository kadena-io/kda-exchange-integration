var Pact = require('./pact-lang-api')

const sleepPromise = async (timeout) => {
  return new Promise(resolve => {
      setTimeout(resolve, timeout);
  });
}

const pollTxRes = async (reqKey, host) => {
  //check kadena tx status every 5 seconds until we get a response (success or fail)
  var time = 480;
  var pollRes;
  while (time > 0) {
    await sleepPromise(5000);
    pollRes = await Pact.fetch.poll({requestKeys: [reqKey]}, host);
    if (Object.keys(pollRes).length === 0) {
      time = time - 5
    } else {
      time = 0;
    }
  }
  console.log(pollRes[reqKey])
  if (pollRes[reqKey].result.status === 'success') {
    return true
  } else {
    return false
  }
}

module.exports = {
  sleepPromise,
  pollTxRes
}
