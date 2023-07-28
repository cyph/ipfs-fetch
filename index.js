const HeliaUnixFS = import('@helia/unixfs');
const Helia = import('helia');
const Multiformats = import('multiformats/cid');

const ipfs = Helia.then(async ({createHelia}) =>
	(await HeliaUnixFS).unixfs(await createHelia())
);

const ipfsFetch = async (hash, {timeout} = {}) => {
	timeout =
		typeof timeout === 'number' && !isNaN(timeout) && timeout > 0 ?
			timeout :
			undefined;

	const result = (async () => {
		const iter = (await ipfs).cat(
			(await Multiformats).CID.parse(hash),
			timeout !== undefined && typeof AbortSignal !== 'undefined' ?
				{signal: AbortSignal.timeout(timeout)} :
				undefined
		);

		const buffers = [];
		for await (const buf of iter) {
			buffers.push(buf);
		}
		return Buffer.concat(buffers);
	})();

	if (timeout === undefined || typeof AbortSignal !== 'undefined') {
		return result;
	}

	const timeoutPromise = new Promise(resolve => {
		setTimeout(resolve, timeout);
	}).then(() => {
		throw new Error(`Timeout of ${timeout.toString()} exceeded.`);
	});

	return Promise.race([result, timeoutPromise]);
};

module.exports = ipfsFetch;
module.exports.ipfsFetch = ipfsFetch;
