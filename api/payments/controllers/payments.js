'use strict';
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

const querystring = require("querystring");
const { Curl } = require("node-libcurl");
require('dotenv').config();
const crypto = require('crypto');
// const IV = crypto.randomBytes(32);
const IV = 'PGKEYENCDECIVSPC';

var request = require('request');
var aesjs = require('aes-js');

function aesEncrypt(trandata, key) {
  var iv = "PGKEYENCDECIVSPC";
  var rkEncryptionIv = aesjs.utils.utf8.toBytes(iv);
  var enckey = aesjs.utils.utf8.toBytes(key);
  var aesCtr = new aesjs.ModeOfOperation.cbc(enckey, rkEncryptionIv);
  var textBytes = aesjs.utils.utf8.toBytes(trandata);
  var encryptedBytes = aesCtr.encrypt(aesjs.padding.pkcs7.pad(textBytes));
  var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  // console.log(encryptedHex);
  return encryptedHex;
}
var encrypt = ((val, key) => {
  let cipher = crypto.createCipheriv('aes-256-cbc', key, IV);
  let encrypted = cipher.update(val, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  console.log(encrypted);

  return encrypted;
});
var decrypt = ((encrypted) => {
  let decipher = crypto.createDecipheriv('aes-256-cbc', process.env.TERMINAL_RESOURCE_KEY, IV);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  return (decrypted + decipher.final('utf8'));
});

// function beginGatewayRequest(body) {

//   const curlTest = new Curl();
//   const terminate = curlTest.close.bind(curlTest);
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
//     console.log("Data: \n" + data);
//     // console.log(data);
//     return data
//   })
//   curlTest.on("error", (e) => {
//     console.log(e.message);
//     return "Error";
//   })

//   let dataresponse = curlTest.perform();
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
  // body = JSON.stringify(body)
  let response = request(
    {
      url: "https://securepayments.alrajhibank.com.sa/pg/payment/hosted.htm",
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': body.length,
        'charset': 'utf-8'
      },
      method: "POST",
      body: body
    },
    function (error, response, body) {
      // console.log("Response Body:\n", body);
      return body
    }
  );

  return response
}
async function processQuotationPaymentRequest(response) {
  let decodedResponse = response

  // console.log(decodedResponse);

  return decodedResponse
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
      amt: 10000.00,
      action: 1,
      id: process.env.FORD_TRANPORTAL_ID,
      password: process.env.FORD_TRANPORTAL_PASSWORD,
      currencyCode: 682,
      trackId: 123456,
      responseURL: 'http://localhost:8000/admin', //route(‘payment-redirect’),
      errorURL: 'http://localhost:8000/admin'
    }

    trandata = JSON.stringify(trandata)
    let body = [{
      id: process.env.FORD_TRANPORTAL_ID,
      trandata: aesEncrypt(trandata, process.env.FORD_TERMINAL_RESOURCE_KEY),
      responseURL: 'http://localhost:8000/admin',
      errorURL: 'http://localhost:8000/adminn'
    }]

    body = JSON.stringify(body)

    let response = beginGatewayRequest(body)
    // let finalresponse = processQuotationPaymentRequest(response)

    return response
  },
  update: async (ctx) => {
    const { id } = ctx.params;

    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      entity = await strapi.services.payments.update({ id }, data, {
        files,
      });
    } else {
      const payment = await strapi.services.payments.findOne({ id })
      // const doc = new PDFDocument();
      // doc.pipe(fs.createWriteStream('output.pdf'));


      entity = await strapi.services.payments.update({ id }, ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.payments });
  }
};
