# Cybersource Authentication
A javascript package that conveniently:
- Generates your Cybersource API authentication headers for you.
- Validate your JWT token from Cybersource and decodes.

# Installation.

using NPM

```sh
npm install cybersource-auth
```

Or with YARN

```sh
yarn add cybersource-auth
```


# Generate Request Headers
This method helps you create your Cybersource API request headers.
 
Import the package
```js
const { createHeaders } = require('cybersource-auth');
```
Then just plug in the required params. 

### If it's a POST or PUT request:
```js
const headers = createHeaders(
    "testrest", // cybersource merchant id
    "apitest.cybersource.com", // your host
    "POST", // http method 
    "/pts/v2/payments", // your target api path
    JSON.stringify(requestPayload), // Your JSON payload as string
    "08c94330-f618-42a3-b09d-e1e43be5efda", // Your key ID from Cybersource
    "yBJxy6LjM2TmcPGu+GaJrHtkke25fPpUX+UY6/L/1tE=" // Cybersource secret key a.k.a Shared Secret
);
```
Sample output
```json
{
    "v-c-merchant-id": "testrest",
    "Date": "Fri, 07 Mar 2025 18:38:56 GMT",
    "Host": "apitest.cybersource.com",
    "Signature": "keyid=\"08c94330-f618-42a3-b09d-e1e43be5efda\", algorithm=\"HmacSHA256\", headers=\"host date (request-target) digest v-c-merchant-id\", signature=\"Sz74Sw7dRSePxcC/hxUkvnwAgLmrAVB7nCrPcO+j7qE=\"",
    "Content-Type": "application/json",
    "Digest": "SHA-256=yeL5bhMyypYx8RkK8sGx/LcWP2ltjglhXpvBJjXTMdc="
}
```
Then go ahead and plugs the headers directly in your request, like this:
```js
 try {
    let jsonString = JSON.stringify({
        "targetOrigins": [
            "http://localhost:3000",
            "https://www.example.net"
        ],
        "allowedCardNetworks": [
            "VISA",
            "MASTERCARD",
            "AMEX"
        ],
        "allowedPaymentTypes": [
            "CARD"
        ],
        "clientVersion": "v2.0"
    })
    let requestPath = "/microform/v2/sessions"
    let host = "apitest.cybersource.com"
    let merchantId = "testrest"
    let keyId = "08c94330-f618-42a3-b09d-e1e43be5efda"
    let secretKey = "yBJxy6LjM2TmcPGu+GaJrHtkke25fPpUX+UY6/L/1tE="

    const requestHeaders = createHeaders(
        merchantId,
        host,
        "POST",
        requestPath,
        jsonString,
        keyId,
        secretKey
    )

    let cybsResponse = await axios.post(
        "https://" + host + requestPath,
        jsonString,
        {
            headers: requestHeaders
        }
    )
    response.status(cybsResponse.status).send(cybsResponse.data)
} catch (error) {
    response.status(500).send(error.message);
}
```

### If it's a GET request:
```js
const headers = createHeaders(
    "testrest", // cybersource merchant id
    "apitest.cybersource.com", // your host
    "GET", // http method 
    "/invoicing/v2/invoiceSettings", // your target api path
    '', // just an empty string
    "08c94330-f618-42a3-b09d-e1e43be5efda", // Your key ID from Cybersource
    "yBJxy6LjM2TmcPGu+GaJrHtkke25fPpUX+UY6/L/1tE=" // Cybersource secret key a.k.a Shared Secret
);
```
Sample output. Note how the absence of the 'Digest' header.
```json
{
    "v-c-merchant-id": "testrest",
    "Date": "Fri, 07 Mar 2025 16:56:09 GMT",
    "Host": "apitest.cybersource.com",
    "Signature": "keyid=\"08c94330-f618-42a3-b09d-e1e43be5efda\", algorithm=\"HmacSHA256\", headers=\"host date (request-target) v-c-merchant-id\", signature=\"WDaGQFWDaeSeveTXxvFBAOgiVFOGscNHPel2tOaMifQ=\"",
    "Content-Type": "application/json"
}
```
Then go ahead and plugs the headers directly in your request, like this:
```js
try {
    let jsonString = ''
    let requestPath = "/invoicing/v2/invoiceSettings"
    let host = "apitest.cybersource.com"
    let merchantId = "testrest"
    let keyId = "08c94330-f618-42a3-b09d-e1e43be5efda"
    let secretKey = "yBJxy6LjM2TmcPGu+GaJrHtkke25fPpUX+UY6/L/1tE="

    const requestHeaders = createHeaders(
        merchantId,
        host,
        "GET",
        requestPath,
        jsonString, 
        keyId,
        secretKey
    )

    let cybsResponse = await axios.get(
        "https://" + host + requestPath,
        {
            headers: requestHeaders
        }
    )
    response.status(cybsResponse.status).send(cybsResponse)
} catch (error) {
    response.status(500).send(error.message);
}
```




# Validate JWT

```js
const { validateJwt } = require('cybersource-auth');
```

Then plug in the token and your host:

```js
let jwtToken = "big.JwtToken.String"
let host = "apitest.cybersource.com"
let decoded = await validateJwt(jwtToken, host)
```
If token is valid, the `decoded` output would be:
```json
{
    "flx": {
        "path": "/flex/v2/tokens",
        "data": "q1SrfE6JO3aYhV7tmuEO3xAAEAGaC/flb/z5754fOJ8Ypza+kZwcb0YhJ1ih1D1WxzUiYgYwpgiCZ0NOrObwkAMmUP3bh5CsvbhQT2CZtmkj/d/wAYUIOfBn4mqFbWmSNgmd",
        "origin": "https://testflex.cybersource.com",
        "jwk": {
            "kty": "RSA",
            "e": "AQAB",
            "use": "enc",
            "n": "3iYvhPuMQoyH_xX8AiI3orn0yjxvr4ufIkSmoxVSmOFg12sTVbRAPUdS5TrZAKJUwhdpLaoVoC5-TtQTYwkIXagEC4QAmdYllqmH0fw0lfckyTMzAtLvFX6rqU7jkHf-QgIxDohwQiXLhEe06Kre6RqNtL-5vwug4uT6peLaI5q1EoDSZa1nWSqLAXCKuVMw3qfGxVvrFl_r-K8DblG3xHrYDn0XHVeBURpIh-UlnyeZJXj72GsyrxZy0J-uk6LUOQQSuJJan0cHgy164UZAcedTRDFvuIQQf8s5ieTG6mm9g8WoMeTdpYZSSUFaMdrZqPAQeMYueYInCXfzjMnjCw",
            "kid": "07IywPACanM9UPuO9TQ6riy88mEdqUv6"
        }
    },
    "ctx": [
        {
            "data": {
                "clientLibraryIntegrity": "sha256-4TUKBd3VMIGGNs1ZLzfU6bG0YG4kUScSOtPu5ec7Ygo=",
                "clientLibrary": "https://testflex.cybersource.com/microform/bundle/v2.0.2/flex-microform.min.js",
                "allowedCardNetworks": [
                    "VISA",
                    "MASTERCARD",
                    "AMEX"
                ],
                "targetOrigins": [
                    "http://localhost:3000",
                    "https://www.example.net"
                ],
                "mfOrigin": "https://testflex.cybersource.com"
            },
            "type": "mf-2.0.0"
        }
    ],
    "iss": "Flex API",
    "exp": 1741417277,
    "iat": 1741416377,
    "jti": "YEoklGF9hS78usgy"
}
```