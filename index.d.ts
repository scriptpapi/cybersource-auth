declare module "your-npm-package" {
    /**
     * Generates request headers for CyberSource API authentication.
     * @param merchantId - Merchant ID
     * @param host - API host
     * @param httpMethod - HTTP method (GET, POST, etc.)
     * @param requestPath - API request path
     * @param jsonString - Request body (for POST/PUT)
     * @param keyId - Key ID for authentication
     * @param secretKey - Secret key for HMAC signature
     * @returns Headers object
     */
    export function createHeaders(
        merchantId: string,
        host: string,
        httpMethod: "GET" | "POST" | "PUT" | "DELETE",
        requestPath: string,
        jsonString: string,
        keyId: string,
        secretKey: string
    ): Record<string, string>;

    /**
     * Validates and decodes a CyberSource JWT token.
     * @param token - The JWT token from CyberSource
     * @param host - CyberSource API host
     * @returns A promise that resolves with the decoded JWT payload
     */
    export function validateJwt(
        token: string,
        host: string
    ): Promise<Record<string, any>>;
}
