# Cybersource HTTP Signature Authentication


A javascript method that conveniently generates your Cybersource API authentication headers for you.

# Installation.

using NPM

```sh
npm install cybersource-auth
```

Or with YARN

```sh
yarn add cybersource-auth
```


# How to use.
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



