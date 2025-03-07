const crypto = require('crypto');

function createHeaders(merchantId, host, httpMethod, requestPath, jsonString, keyId, secretKey) {
    const date = new Date().toUTCString();

    // Create digest, Only for POST and PUT requests
    let digest = null;
    if (['POST', 'PUT'].includes(httpMethod.toUpperCase())) {
        digest = "SHA-256=" + crypto.createHash('sha256').update(jsonString).digest().toString('base64');
    }

    // Define headers to be included in the signature
    const headersList = ['host', 'date', '(request-target)', 'v-c-merchant-id'];
    if (digest) headersList.splice(3, 0, 'digest');

    // Create the signature string
    const signatureString = headersList.map(header => {
        switch (header) {
            case 'host':
                return `host: ${host}`;
            case 'date':
                return `date: ${date}`;
            case '(request-target)':
                return `(request-target): ${httpMethod.toLowerCase()} ${requestPath}`;
            case 'digest':
                return `digest: ${digest}`;
            case 'v-c-merchant-id':
                return `v-c-merchant-id: ${merchantId}`;
            default:
                return '';
        }
    }).join('\n');

    // Compute the HMAC-SHA256 signature, using decoded secret key
    const hmac = crypto.createHmac('sha256', Buffer.from(secretKey, 'base64'));
    hmac.update(signatureString);
    const signature = hmac.digest('base64');

    // Construct the Signature header
    const signatureHeader = `keyid="${keyId}", algorithm="HmacSHA256", headers="${headersList.join(' ')}", signature="${signature}"`;

    // Return all necessary headers
    const headers = {
        'v-c-merchant-id': merchantId,
        'Date': date,
        'Host': host,
        'Signature': signatureHeader,
        'Content-Type': "application/json"
    };

    // Add the digest if it's a POST/PUT
    if (digest) headers['Digest'] = digest;

    return headers;
}

module.exports = { createHeaders };
