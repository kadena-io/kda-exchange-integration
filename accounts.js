
//recipent is a public key or a txBuilder
//  toAcct -> "string" -> /local if exists, fetches those account detials.
//    If not, makes sure sure its a pub key, and if not it fails
const onlineTransfer = (fromAcct, toAcct, amount, meta) => {
  //coin.details on toAcct
  //  if exists keep the keyset (do we check?? just case of name squatting)
  //  if not exist enforce toAcct is a public key
  //  if neither fail
}



//recipent is a public key or a txBuilder
//  toAcct -> "string" -> /local if exists, fetches those account detials.
//    If not, makes sure sure its a pub key, and if not it fails
const onlineTransfer = (fromAcct, toAcct, amount, fromChainId, toChainId, ) => {
  var details = callDetails(meta, toAcct);
  if ( details !== null ) {

    // We might ditch this whole section...garbage in, garbage out
    // Probably ditch...not exchange’s problem
    if ( length(details.account) == 64 && isHex(details.account) ) {
      // Extra safety check
      if ( details.account == details.keys[0] ) {
        // All good
      }
    }

  }
  //coin.details on toAcct
  //  if exists keep the keyset (do we check?? just case of name squatting)
  //  if not exist enforce toAcct is a public key
  //  if neither fail
}

