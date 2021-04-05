/** chainweb.js
 * Exports functions to support interacting with a chainweb block chain
 * Author: Lar Kuhtz
 */

const base64url = require("base64-url");
const fetch = require("node-fetch");
var EventSource = require('eventsource')
const pRetry = require('p-retry');

/* ************************************************************************** */
/* Utils */

/**
 * Decode base64url encoded JSON text
 */
const base64json = txt => JSON.parse(base64url.decode(txt));

/**
 * Retry a fetch callback
 *
 * @param {Object} [retryOptions] - retry options object as accepted by the retry package
 * @param {boolean} [retryOptions.retry404=false] - whether to retry on 404 results
 * @return {Promise} Promise object that represents the response of the fetch action.
 */
const retryFetch = async (retryOptions, fetchAction) => {

    let retry404 = false;
    if (retryOptions) {
        retry404 = retryOptions.retry404 ?? false;
    } else {
        retryOptions = {
            onFailedAttempt: x => console.log(x),
            retries: 2,
            minTimeout: 500,
            randomize: true
        };
    }

    const run = async () => {
        const response = await fetchAction();
        if (response.status == 200) {
            return response;

        // retry 404 if requested
        } else if (response.status == 404 && retry404) { // not found
            throw response

        // retry potentially ephemeral failure conditions
        } else if (response.status == 408) { // response timeout
            throw response
        } else if (response.status == 423) { // locked
            throw response
        } else if (response.status == 425) { // too early
            throw response
        } else if (response.status == 429) { // too many requests
            throw response
        } else if (response.status == 500) { // internal server error
            throw response
        } else if (response.status == 502) { // bad gateway
            throw response
        } else if (response.status == 503) { // service unavailable
            throw response
        } else if (response.status == 504) { // gateway timeout
            throw response

        // don't retry on anything else
        } else if (response.status == 204) { // no content
            return pRetry.AbortError(response);
        } else {
            return pRetry.AbortError(response);
        }
    }

    const res = await pRetry(run, retryOptions);
    return res;
}

/**
 * @param {string} [network="mainnet01"] - chainweb network
 * @param {string} [host="https://api.chainweb.com"] - chainweb api host
 * @param {string} pathSuffix - suffix of the path that is appended to the path of the base URL
 */
const baseUrl = (network = "mainnet01", host = "https://api.chainweb.com", pathSuffix) => {
    return new URL(`${host}/chainweb/0.0/${network}/${pathSuffix}`);
}

/**
 * @param {number|string} chainId - a chain id that is valid for the network
 * @param {string} [network="mainnet01"] - chainweb network
 * @param {string} [host="https://api.chainweb.com"] - chainweb api host
 * @param {string} pathSuffix - suffix of the path that is appended to the path of the chain URL
 */
const chainUrl = (chainId, network, host, pathSuffix) => {
    // if (! chainId) {
    //     throw "missing chainId parameter";
    // }
    return baseUrl(network, host, `chain/${chainId}/${pathSuffix}`);
}

/* ************************************************************************** */
/* Chainweb API Requests */

/**
 * Cut the current cut from a chainweb node
 *
 * @param {string} [network="mainnet01"] - chainweb network
 * @param {string} [host="https://api.chainweb.com"] - chainweb api host
 * @param {Object} [retryOptions] - retry options object as accepted by the retry package
 * @param {boolean} [retryOptions.retry404=false] - whether to retry on 404 results
 * @return {Object} cut hashes object
 */
const currentCut = async (network, host, retryOptions) => {
    const response = await retryFetch(
        retryOptions,
        () => fetch(baseUrl(network, host, "cut"))
    );
    return response.json();
}

/**
 * P2P peers of the cut network
 *
 * @param {string} [network="mainnet01"] - chainweb network
 * @param {string} [host="https://api.chainweb.com"] - chainweb api host
 * @param {Object} [retryOptions] - retry options object as accepted by the retry package
 * @param {boolean} [retryOptions.retry404=false] - whether to retry on 404 results
 * @return {Object[]} Array of peer objects
 *
 * TODO: support paging
 */
const cutPeers = async (network, host, retryOptions) => {
    const response = await retryFetch(
        retryOptions,
        () => fetch(baseUrl(network, host, "cut/peer"))
    );
    return response.json();
}

/**
 * Return block headers from chain in decending order
 *
 * @param {number|string} chainId - a chain id that is valid for the network
 * @param {string[]} [upper]- only antecessors of these block hashes are returned. Note that if this is null, the result is empty.
 * @param {string[]} [lower] - no antecessors of these block hashes are returned.
 * @param {number} [minHeight] - if given, minimum height of returned headers
 * @param {number} [maxHeight] - if given, maximum height of returned headers
 * @param {string} [network="mainnet01"] - chainweb network
 * @param {string} [host="https://api.chainweb.com"] - chainweb api host
 * @param {Object} [retryOptions] - retry options object as accepted by the retry package
 * @param {boolean} [retryOptions.retry404=false] - whether to retry on 404 results
 * @return {Object[]} Array of block header objects
 *
 * TODO: support paging
 */
const branch = async (chainId, upper, lower, minHeight, maxHeight, network, host, retryOptions) => {

    /* URL */
    let url = chainUrl(chainId, network, host, "header/branch");
    if (minHeight) {
        url.searchParams.append("minheight", minHeight);
    }
    if (maxHeight) {
        url.searchParams.append("maxheight", maxHeight);
    }

    /* Body */
    const body = {
        upper: upper,
        lower: lower
    };

    const response = await retryFetch(
        retryOptions,
        () => fetch(url, {
            method: 'post',
            body: JSON.stringify(body),
            headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json;blockheader-encoding=object'
            }
        })
    );
    return response.json();
}

/**
 * Payloads with outputs
 *
 * @param {number|string} chainId - a chain id that is valid for the network
 * @param {string[]} hashes - array of block payload hashes
 * @param {string} [network="mainnet01"] - chainweb network
 * @param {string} [host="https://api.chainweb.com"] - chainweb api host
 * @param {Object} [retryOptions] - retry options object as accepted by the retry package
 * @param {boolean} [retryOptions.retry404=false] - whether to retry on 404 results
 * @return {Object[]} Array of block header objects
 *
 * TODO: support paging
 */
const payloads = async (chainId, hashes, network, host, retryOptions) => {

    const url = chainUrl(chainId, network, host, `payload/outputs/batch`);

    const response = await retryFetch(
        retryOptions,
        () => fetch(url, {
            method: 'post',
            body: JSON.stringify(hashes),
            headers: {
            'Content-Type': 'application/json'
            }
        })
    );

    let res = await response.json();

    return res.map(x => {
        const txs = x.transactions;
        x.minerData = base64json(x.minerData);
        x.coinbase = base64json(x.coinbase);
        x.transactions = txs.map(y => {
            const tx = base64json(y[0]);
            const out = base64json(y[1]);
            tx.cmd = JSON.parse(tx.cmd);
            return {
                transaction: tx,
                output: out
            };
        });
        return x;
    });
}

/**
 * Call back for processing individual headers of a header stream
 *
 * @callback headerCallback
 * @param {Object} header - block header object
 */

/**
 * @param {headerCallback} callback - header callback for handling block headers
 * @param {string} [network="mainnet01"] - chainweb network
 * @param {string} [host="https://api.chainweb.com"] - chainweb api host
 */
const headerStream = (callback, network, host) => {
    const url = baseUrl(network, host, "header/updates");
    const es = new EventSource(`${url}`);

    es.onerror = (err) => { throw err; };

    es.addEventListener('BlockHeader', (m) => {
        const hdr = JSON.parse(m.data).header;
        callback(hdr);
    });

    return es;
}

/* ************************************************************************** */
/* Headers */

const headers = async (chainId, start, end, network, host) => {
    const cut = await currentCut(network, host);
    return branch(
            chainId,
            [cut.hashes[`${chainId}`].hash],
            [],
            start,
            end,
            network,
            host,
            ro
        )
        .then(x => x.items);
}

const recentHeaders = async (chainId, depth = 0, n = 1, network, host) => {
    const cut = await currentCut(network, host);
    return branch(
            chainId,
            [cut.hashes[`${chainId}`].hash],
            [],
            cut.hashes['0'].height - depth - n + 1,
            cut.hashes['0'].height - depth,
            network,
            host
        )
        .then(x => x.items);
}

/* ************************************************************************** */
/* Blocks */

/* Given a set of blocks, collect the corresponding payloads with outputs.
 *
 * TODO: Currently all blocks must be from the same chain. We should support
 * blocks from different chains.
 */
const headers2blocks = async (hdrs, network, host, retryOptions) => {
    if (hdrs.length === 0) {
        return [];
    }

    const chainId = hdrs[0].chainId;
    const pays = await payloads(
        chainId,
        hdrs.map(x => x.payloadHash),
        network,
        host,
        retryOptions
    );

    if (hdrs.length !== pays.length) {
        throw `failed to get payload for some blocks. Requested ${hdrs.length} payloads but got only ${pays.length}`
    }

    let result = [];
    for (let i = 0; i < hdrs.length; ++i) {
        const hdr = hdrs[i], pay = pays[i];
        if (pays[i].payloadHash == hdrs[i].payloadHash) {
            result.push({
                header: hdr,
                payload: pay
            });
        } else {
            throw `failed to get payload for block hash ${hdr.hash} at height ${hdr.height}`
        }
    }
    return result;
}

const blocks = async (chainId, start, end, network, host) => {
    let hdrs = await headers(chainId, start, end, network, host);
    return headers2blocks(network, host, hdrs);
}

const recentBlocks = async (chainId, depth = 0, n = 1, network, host) => {
    let hdrs = await recentHeaders(chainId, depth, n, network, host);
    let ro = {}
    if (depth <= 1) {
        ro = { retry404: true, minTimeout: 1000 };
    }
    return headers2blocks(hdrs, network, host, ro);
}

/* TODO: buffer chunks of headers and replace delay parameter by
 * number of buffered blocks.
 */
const blockStream = (callback, network, host) => {
    const ro = { retry404: true, minTimeout: 1000 };
    headerStream(
        hdr => {
            headers2blocks([hdr], network, host, ro)
            .then(blocks => callback(blocks[0]))
            .catch(err => console.log(err));
        },
        network,
        host
    );
}

/* ************************************************************************** */
/* Transactions */

const filterTxs = (blocks) => {
    return blocks
        .filter(x => x.payload.transactions.length > 0)
        .flatMap(x => x.payload.transactions)
}


const txs = async (chainId, start, end, network, host) => {
    return blocks(chainId, start, end, network, host).then(filterTxs);
}

const recentTxs = async (chainId, depth = 0, n = 1, network, host) => {
    return recentBlocks(chainId, depth, n, network, host).then(filterTxs);
}

const txStream = (callback, network, host) => {
    const url = baseUrl(host, network, "header/updates");
    const es = new EventSource(`${url}`);

    es.onerror = (err) => { throw err; };

    es.addEventListener('BlockHeader', (m) => {
        const ro = { retry404: true, minTimeout: 1000 };
        const data = JSON.parse(m.data);
        if (data.txCount > 0) {
            headers2blocks([data.header], network, host, ro)
            .then(blocks => {
                const txs = filterTxs(blocks)
                txs.map(x => callback(x));
            })
            .catch(err => console.log(err));
        }
    });
    return es;
}

/* ************************************************************************** */
/* Events */

const filterEvents = (blocks) => {
    return blocks
        .filter(x => x.payload.transactions.length > 0)
        .flatMap(x => x.payload.transactions.flatMap(y => y.output.events))
        .filter(x => x !== undefined);
}

const events = async (chainId, start, end, network, host) => {
    return blocks(chainId, start, end, network, host).then(filterEvents);
}

/**
 * Payloads with outputs
 *
 * @param {number|string} chainId - a chain id that is valid for the network
 * @param {number} depth - confirmation depth. Only events of blocks that this depth are returned.
 * @param {number} n - maximual number of blocks from which events are returned. The actual number of returned events may be lower.
 * @param {string} [network="mainnet01"] - chainweb network
 * @param {string} [host="https://api.chainweb.com"] - chainweb api host
 * @return {Promise} Array of Pact events
 *
 * TODO: support paging
 */
const recentEvents = async (chainId, depth = 0, n = 1, network, host) => {
    return recentBlocks(chainId, depth, n, network, host).then(filterEvents);
}

/* the implementation is similar to blocks stream, but ignores
 * headers without txs
 */
const eventStream = (callback, network, host) => {
    const url = baseUrl(host, network, "header/updates");
    const es = new EventSource(`${url}`);

    es.onerror = (err) => { throw err; };

    es.addEventListener('BlockHeader', (m) => {
        const ro = { retry404: true, minTimeout: 1000 };
        const data = JSON.parse(m.data);
        if (data.txCount > 0) {
            headers2blocks([data.header], network, host, ro)
            .then(blocks => {
                filterEvents(blocks).map(x => callback(x));
            })
            .catch(err => console.log(err));
        }
    });
    return es;
}

/* ************************************************************************** */

module.exports = {
    cut: {
        current: currentCut,
        peers: cutPeers
    },
    branch: branch,
    payloads: payloads,

    headers: {
        range: headers,
        recent: recentHeaders,
        stream: headerStream
    },
    blocks: {
        range: blocks,
        recent: recentBlocks,
        stream: blockStream
    },
    events: {
        range: events,
        recent: recentEvents,
        stream: eventStream
    },
    transactions: {
        range: txs,
        recent: recentTxs,
        stream: txStream
    }
};
