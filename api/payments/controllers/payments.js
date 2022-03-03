'use strict';

const fs = require('fs-extra');
const hbs = require('handlebars')
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const puppeteer = require('puppeteer')
require('dotenv').config();
const crypto = require('crypto');
// const IV = crypto.randomBytes(32);
const IV = 'PGKEYENCDECIVSPC';
const path = require('path')
const moment = require('moment')
var request = require('request');
var aesjs = require('aes-js');


// Compiling of handlebars template to PDF
const compile = async (templateName, data) => {
  const filePath = path.join(process.cwd(), 'templates', `${templateName}.hbs`)
  const html = await fs.readFile(filePath, 'utf-8')

  return hbs.compile(html)(data)
}

hbs.registerHelper('dateFormat', (value, format) => {
  return moment(value).format(format)
})

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


async function createPDF(payment) {

  try {

    const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const content = await compile('template', [])
    const path = `./public/invoices/${payment.name}-${payment.id}.pdf`
    await page.setContent(content);
    await page.pdf({
      path,
      format: 'A4',
      printBackground: true
    })
    await browser.close()
    process.exit
    return path
  } catch (error) {
    console.log(error);
  }
}

async function beginGatewayRequest(body) {

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
    try {
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

    } catch (error) {
      console.log(error.message);
    }

    // let body = ctx.request.body
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
      const Link = createPDF(payment)
      entity = await strapi.services.payments.update({ id }, { ...ctx.request.body, status: 'paid', invoice: '', Link });

    }
    return sanitizeEntity(entity, { model: strapi.models.payments });
  },

};
