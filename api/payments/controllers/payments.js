'use strict';
const querystring = require("querystring");
const { Curl } = require("node-libcurl");
require('dotenv').config();
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
// const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const http = require('http');

var request = require('request');

function encrypt(text) {
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.TERMINAL_RESOURCE_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

function decrypt(text) {
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.TERMINAL_RESOURCE_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}


// function beginGatewayRequest(body) {

//   const curlTest = new Curl();
//   const terminate = curlTest.close.bind(curlTest);

//   let dataresponse = ""
//   const url = "https://securepayments.alrajhibank.com.sa/pg/payment/hosted.htm";

//   curlTest.setOpt(Curl.option.URL, url)
//   curlTest.setOpt(Curl.option.VERBOSE, true)
//   curlTest.setOpt(Curl.option.SSL_VERIFYPEER, false)
//   // curlTest.setOpt(Curl.option.r)
//   curlTest.setOpt(Curl.option.POST, 1)
//   curlTest.setOpt(Curl.option.HEADER, ['Content-Type: application/json', 'charset: utf-8', 'Content-Length: ' + body.length])
//   curlTest.setOpt(Curl.option.CONNECTTIMEOUT, 3)
//   curlTest.setOpt(Curl.option.TIMEOUT, 20)
//   curlTest.setOpt(Curl.option.POSTFIELDS, body)

//   curlTest.on("end", (statusCode, data, headers) => {
//     console.log("Ended Succesfuly\n " + "Status Code: " + statusCode);
//     // console.log("Data: \n" + data);
//     console.log(headers);

//     return data
//   })
//   curlTest.on("error", (e) => {
//     console.log(e.message);
//     return "Error";
//   })

//   dataresponse = curlTest.perform();
//   curlTest.close()

//   return dataresponse
// }

// async function beginGatewayRequest2(body) {

//   const url = "securepayments.alrajhibank.com.sa";
//   let dataresponse = "not changed"
//   const options = {
//     hostname: url,
//     path: '/pg/payment/hosted.htm',
//     method: 'POST',
//     // port: 443,
//     body: body,
//     headers: {
//       'Content-Type': 'application/json',
//       'Content-Length': Buffer.byteLength(body)
//     }
//   };
//   const req = http.request(options, (res) => {
//     console.log(`STATUS: ${res.statusCode}`);
//     console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
//     res.setEncoding('utf8');
//     res.on('data', (chunk) => {
//       console.log(`BODY: ${chunk}`);
//     });
//     res.on('end', () => {
//       console.log('No more data in response.');

//     });
//     console.log("end of request, \n", res);
//   });

//   req.on('error', (e) => {
//     console.error(`problem with request: ${e.message}`);
//     return e.message
//   });

//   // Write data to request body
//   // req.write(body);
//   req.end();

//   return "asd"
// }
async function beginGatewayRequest(body) {

  const url = "securepayments.alrajhibank.com.sa";

  let response = request(
    {
      url: "https://securepayments.alrajhibank.com.sa/pg/payment/hosted.htm",
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        'charset': 'utf-8'
      },
      method: "POST",
      json: true,   // <--Very important!!!
      body: body,
    },
    function (error, response, body) {
      console.log(response.toJSON());
      return response
    }
  );

  return response
}

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  generatePaymentLink: async (ctx) => {

    // const body = new TextEncoder().encode(JSON.stringify(ctx.request.body))

    let trandata =
    {
      amt: 10000,
      action: 1,
      id: process.env.TRANPORTAL_ID,
      password: process.env.TRANPORTAL_PASSWORD,
      currencyCode: 682,
      trackId: 1293103901,
      responseURL: 'https://www.facebbook.com', //route(‘payment-redirect’),
      errorURL: 'https://www.google.com'
    }

    trandata = new TextEncoder().encode(JSON.stringify(trandata))

    let body = {
      trandata: encrypt(trandata),
      id: process.env.TRANPORTAL_ID,
      responseURL: 'https://www.google.com',
      errorURL: 'https://www.linkedin.com'
    }
    body = new TextEncoder().encode(JSON.stringify(body))
    body = '[' + body + ']'

    let response = beginGatewayRequest(body)

    return response
  },
};
