const jwt = require('jsonwebtoken');

const blocklist = new Map();

const add = (token) => {
  const decoded = jwt.decode(token);
  if (decoded?.exp) {
    blocklist.set(token, decoded.exp * 1000);
  }
};

const isBlocked = (token) => blocklist.has(token);

const cleanup = () => {
  const now = Date.now();
  for (const [token, expMs] of blocklist) {
    if (expMs <= now) {
      blocklist.delete(token);
    }
  }
};

const reset = () => blocklist.clear();

setInterval(cleanup, 60 * 60 * 1000).unref();

module.exports = { add, isBlocked, reset };
