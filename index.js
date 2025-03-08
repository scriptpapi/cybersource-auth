const crypto = require('crypto');
const jwt = require("jsonwebtoken");

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

/**
 * Converts CyberSource's public key (modulus `n` and exponent `e`) into PEM format manually.
 * @param {string} n_b64 - Base64 encoded modulus (n)
 * @param {string} e_b64 - Base64 encoded exponent (e)
 * @returns {string} - PEM formatted public key
 */
function convertPublicKeyToPEM(n_b64, e_b64) {
    const n_hex = Buffer.from(n_b64, "base64").toString("hex");
    const e_hex = Buffer.from(e_b64, "base64").toString("hex");

    return `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A${n_hex}AQAB${e_hex}-----END PUBLIC KEY-----`;
}

/**
 * Fetches CyberSource's public key using the `kid` from JWT header.
 * @param {string} kid - Key ID from JWT header
 * @returns {Promise<string>} - Resolves with PEM formatted public key
 */
async function fetchPublicKey(kid, host) {
    const url = `https://${host}/flex/v2/public-keys/${kid}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`Failed to fetch public key: ${response.statusText}`);
    }

    const { n, e } = await response.json();
    return convertPublicKeyToPEM(n, e);
}

/**
 * Validates and decodes a CyberSource JWT token.
 * @param {string} token - The JWT token from CyberSource
 * @returns {Promise<object>} - Resolves with decoded payload if valid, rejects otherwise
 */
async function validateJwt(token, host) {
    if (!token) throw new Error("Token is required");

    try {
        // Decode JWT header
        const tokenHeader = JSON.parse(Buffer.from(token.split(".")[0], "base64").toString("utf8"));
        if (!tokenHeader.kid) throw new Error("Invalid JWT: missing 'kid'");

        // Fetch the public key using the `kid`
        const pemPublicKey = await fetchPublicKey(tokenHeader.kid, host);

        // Verify and decode the JWT token
        return new Promise((resolve, reject) => {
            jwt.verify(token, pemPublicKey, { algorithms: ["RS256"] }, (err, decoded) => {
                if (err) return reject(new Error("Invalid token: " + err.message));
                resolve(decoded);
            });
        });
    } catch (error) {
        throw new Error("Validation failed: " + error.message);
    }
}

module.exports = { createHeaders, validateJwt };
