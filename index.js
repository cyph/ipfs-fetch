const HeliaUnixFS = import('@helia/unixfs');
const Helia = import('helia');
const Multiformats = import('multiformats/cid');

const ipfs = Helia.then(async ({createHelia}) =>
	(await HeliaUnixFS).unixfs(await createHelia())
);

const ipfsFetch = async (hash, {timeout} = {}) => {
	const result = (async () => {
		const iter = (await ipfs).cat((await Multiformats).CID.parse(hash));
		const buffers = [];
		for await (const buf of iter) {
			buffers.push(buf);
		}
		return Buffer.concat(buffers);
	})();

	const timeoutPromise =
		typeof timeout === 'number' && !isNaN(timeout) && timeout > 0 ?
			new Promise(resolve => {
				setTimeout(resolve, timeout);
			}).then(() =>
				Promise.reject(`Timeout of ${timeout.toString()} exceeded.`)
			) :
			undefined;

	return timeoutPromise ? Promise.race([result, timeoutPromise]) : result;
};

module.exports = ipfsFetch;
module.exports.ipfsFetch = ipfsFetch;
