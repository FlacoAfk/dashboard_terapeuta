const crypto = require('crypto');

function requestContext(req, res, next) {
    const incomingRequestId = req.headers['x-request-id'];
    const requestId = typeof incomingRequestId === 'string' && incomingRequestId.trim()
        ? incomingRequestId.trim()
        : crypto.randomUUID();

    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    next();
}

module.exports = {
    requestContext
};