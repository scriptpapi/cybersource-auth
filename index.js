const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const forge = require("node-forge");

/**
 * Generates request headers for CyberSource API authentication.
 * @param {string} merchantId - Merchant ID
 * @param {string} host - API host
 * @param {string} httpMethod - HTTP method (GET, POST, etc.)
 * @param {string} requestPath - API request path
 * @param {string} jsonString - Request body (for POST/PUT)
 * @param {string} keyId - Key ID for authentication
 * @param {string} secretKey - Secret key for HMAC signature
 * @returns {object} - Headers object
 */
function createHeaders(merchantId, host, httpMethod, requestPath, jsonString, keyId, secretKey) {
    const date = new Date().toUTCString();
    const headersList = ["host", "date", "(request-target)", "v-c-merchant-id"];
    let digest = null;

    if (["POST", "PUT"].includes(httpMethod.toUpperCase())) {
        digest = "SHA-256=" + crypto.createHash("sha256").update(jsonString).digest("base64");
        headersList.splice(3, 0, "digest");
    }

    const signatureString = headersList
        .map((header) => {
            switch (header) {
                case "host":
                    return `host: ${host}`;
                case "date":
                    return `date: ${date}`;
                case "(request-target)":
                    return `(request-target): ${httpMethod.toLowerCase()} ${requestPath}`;
                case "digest":
                    return `digest: ${digest}`;
                case "v-c-merchant-id":
                    return `v-c-merchant-id: ${merchantId}`;
            }
        })
        .join("\n");

    const hmac = crypto.createHmac("sha256", Buffer.from(secretKey, "base64"));
    hmac.update(signatureString);
    const signature = hmac.digest("base64");

    const headers = {
        "v-c-merchant-id": merchantId,
        Date: date,
        Host: host,
        Signature: `keyid="${keyId}", algorithm="HmacSHA256", headers="${headersList.join(
            " "
        )}", signature="${signature}"`,
        "Content-Type": "application/json",
    };

    if (digest) headers["Digest"] = digest;

    return headers;
};


/**
 * Dynamically loads `fetch` based on the Node.js version.
 * Uses built-in fetch in Node.js 18+, otherwise loads `node-fetch` dynamically.
 * @returns {Function} fetch function
 */
async function getFetch() {
    if (typeof globalThis.fetch === "function") {
        return globalThis.fetch;
    } else {
        return (await import("node-fetch")).default;
    }
}

/**
 * Fetches CyberSource's public key using the `kid` from JWT header.
 * @param {string} kid - Key ID from JWT header
 * @param {string} host - CyberSource API host
 * @param {number} [timeout=5000] - Timeout in milliseconds (default: 5000ms)
 * @returns {Promise<string>} - Resolves with PEM formatted public key
 */
async function fetchPublicKey(kid, host, timeout = 5000) {
    const fetch = await getFetch();
    const url = `https://${host}/flex/v2/public-keys/${kid}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });

        if (!response.ok) {
            throw new Error(`Failed to fetch public key (HTTP ${response.status}): ${response.statusText}`);
        }

        const { n, e } = await response.json();
        if (!n || !e) {
            throw new Error("Invalid public key response from CyberSource.");
        }

        return convertPublicKeyToPEM(n, e);
    } catch (error) {
        throw new Error(`Error fetching public key: ${error.message}`);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Converts CyberSource's public key (modulus `n` and exponent `e`) into PEM format.
 * @param {string} n_b64 - Base64 encoded modulus (n)
 * @param {string} e_b64 - Base64 encoded exponent (e)
 * @returns {string} - PEM formatted public key
 */
function convertPublicKeyToPEM(n_b64, e_b64) {
    const n_bytes = Buffer.from(n_b64, "base64");
    const e_bytes = Buffer.from(e_b64, "base64");

    const n = new forge.jsbn.BigInteger(n_bytes.toString("hex"), 16);
    const e = new forge.jsbn.BigInteger(e_bytes.toString("hex"), 16);

    const rsaKey = forge.pki.setRsaPublicKey(n, e);
    return forge.pki.publicKeyToPem(rsaKey);
}

/**
 * Validates and decodes a CyberSource JWT token.
 * @param {string} token - The JWT token from CyberSource
 * @param {string} host - CyberSource API host
 * @param {number} [timeout=5000] - Timeout in milliseconds (default: 5000ms)
 * @returns {Promise<object>} - Resolves with decoded payload if valid, rejects otherwise
 */
async function validateJwt(token, host, timeout = 5000) {
    if (!token) throw new Error("Token is required");

    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) throw new Error("Invalid JWT format");

    let tokenHeader;
    try {
        tokenHeader = JSON.parse(Buffer.from(tokenParts[0], "base64").toString("utf8"));
    } catch (error) {
        throw new Error("Invalid JWT: unable to parse header");
    }

    if (!tokenHeader.kid) throw new Error("Invalid JWT: missing 'kid'");

    const pemPublicKey = await fetchPublicKey(tokenHeader.kid, host, timeout);

    return jwt.verify(token, pemPublicKey, { algorithms: ["RS256"] });
}

// Export functions
module.exports = { createHeaders, validateJwt };
