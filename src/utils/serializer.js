/**
 * Safely serialize objects containing BigInt values into JSON-compatible objects
 * @param {any} obj
 * @returns {any}
 */
function serializeBigInt(obj) {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (typeof value === 'bigint' ? value.toString() : value))
  );
}

module.exports = { serializeBigInt };
