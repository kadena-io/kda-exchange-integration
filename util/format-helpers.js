//------------------------------------------------------------------------------------------------------------------------
//                  NETWORK HELPERS
//------------------------------------------------------------------------------------------------------------------------
export const isHexadecimal = (str) => {
  const regexp = /^[0-9a-fA-F]+$/;
  if (regexp.test(str)) return true;
  else return false;
};

export const checkKey = (key) => {
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

export const formatAmount = (amount) => {
  //allowing max of 4 decimal places
  return (Math.floor(amount * 1e4) / 1e4).toFixed(4);
};
