//PLEASE LOOK INTO THIS FILE FOR DOCUMENTATION ON THE FUNCTION CALLS
const chainweb = require('../chain-data/chainweb');

// chainweb.cut.peers().then(x => console.log("Cut Peers:", x));
// chainweb.cut.current().then(x => console.log("Current Cut:", x));

// chainweb.headers.recent(0, 3, 10).then(x => console.log("Headers:", x));
// chainweb.blocks.recent(0, 3, 10).then(x => console.log("Blocks:", x));
// chainweb.events.recent(0, 3, 1000).then(x => console.log("Events:", x));
// chainweb.transactions.recent(0, 3, 1000).then(x => console.log("Transactions:", x));

// chainweb.headers.range(0, 1500000, 1500010).then(x => console.log("Headers:", x));
// chainweb.blocks.range(0, 1500000, 1500010).then(x => console.log("Blocks:", x));
// chainweb.events.range(0, 1500000, 1500010).then(x => console.log("Events:", x));

// const hs = chainweb.headers.stream(console.log);
const bs = chainweb.blocks.stream(console.log);
// const es = chainweb.events.stream(console.log);
// const ts = chainweb.transactions.stream(console.log);
