//------------------------------------------------------------------------------------------------------------------------
//                  NETWORK HELPERS
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

const checkKAccount = (account) => {
  if (account.startsWith("k:")) {
    const pubKey = account.slice(2);
    return checkKey(pubKey);
  } else {
    return false;
  }
};

const extractPubKeyFromKAccount = (account) => {
  if (checkKAccount(account)) {
    return account.slice(2);
  }
  return null;
}

const formatAmount = (amount) => {
  //allowing max of 8 decimal places
  return (Math.floor(amount * 1e8) / 1e8).toFixed(8);
};

const formatAmountTwelve = (amount) => {
  //allowing max of 12 decimal places
  return (Math.floor(amount * 1e12) / 1e12).toFixed(12);
};

module.exports = {
  checkKAccount,
  extractPubKeyFromKAccount,
  checkKey,
  formatAmount,
  formatAmountTwelve
}
