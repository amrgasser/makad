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
// EMAIL STUFF
// const hbsexpress = require('nodemailer-express-handlebars')
const nodemailer = require('nodemailer')

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'amr.r.gasser@gmail.com',
//     pass: 'xthioibjcuiflcjg'
//   }
// });
// const handlebarOptions = {
//   viewEngine: {
//     partialsDir: path.resolve('./templates/email-success.hbs'),
//     defaultLayout: false,
//   },
//   viewPath: path.resolve('./templates'),
// };
// transporter.use('compile', hbsexpress(handlebarOptions))


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

      // const Link = createPDF(payment)
      entity = await strapi.services.payments.update({ id }, { ...ctx.request.body, status: 'paid', invoice: '' });
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'amr.r.gasser@gmail.com',
            pass: 'xthioibjcuiflcjg'
          }
        });
        var template = hbs.compile(emailTemplate.html);
        var replacements = {
          name: entity.firstName,
          id: entity.id,
          unitName: entity.unit.unitName,
          zoneName: entity.zone.zoneName,
          totalUnitPrice: entity.totalUnitPrice,
          downPayment: entity.downPayment,
          tax: entity.totalUnitPrice * 0.05,
          dueAmount: entity.totalUnitPrice - entity.downPayment,
        };
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: 'amr.r.gasser@gmail.com',
          to: entity.email,
          subject: 'Sending Email using Node.js',
          html: htmlToSend,
          attachments: [
            {
              filename: 'map_84fb534fcd.png',
              path: `public/map_84fb534fcd.png`,
              cid: 'logo1' //same cid value as in the html img src
            }, {
              filename: 'twitter.png',
              path: `public/twitter.png`,
              cid: 'twitter' //same cid value as in the html img src
            }, {
              filename: 'facebook.png',
              path: `public/facebook.png`,
              cid: 'facebook' //same cid value as in the html img src
            }, {
              filename: 'instagram-blue.png',
              path: `public/instagram-blue.png`,
              cid: 'instagram' //same cid value as in the html img src
            }, {
              filename: 'download.svg',
              path: `public/download.svg`,
              cid: 'download' //same cid value as in the html img src
            }
          ]
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });

      } catch (error) {
        console.log(error);

      }
    }
    return sanitizeEntity(entity, { model: strapi.models.payments });

    // trigger the sending of the E-mail
  },
  findOne: async (ctx) => {
    const { id } = ctx.params;
    const entity = await strapi.services.payments.findOne({ id });
    // const building = await strapi.services['building-type'].findOne({id})
    const homeAtMakadi = await strapi.services['home-at-makadi-heights'].find()
    console.log(homeAtMakadi);
    const zoneCard = homeAtMakadi.zones.filter((zone) => zone.Name.toLowerCase() == entity.zone.zoneName.toLowerCase())
    // console.log(zoneCard[0]);

    // let zoneText = ''
    // for (let index = 0; index < homeAtMakadi.zones; index++) {
    //   const element = homeAtMakadi.zones[index];
    //   console.log(elements);
    //   if (element.Name.toLowerCase() == payment.zone.zoneName) {
    //     zoneText = element.bottomDescription
    //     break
    //   }
    // }
    const faqs = await strapi.services.faq.find()
    entity.zoneDescription = zoneCard.bottomDescription
    entity.faqs = faqs

    return sanitizeEntity(entity, { model: strapi.models.payments });
  }

};

const emailTemplate = {
  subject: 'Makadi Height Receipt',
  html: `
    <html>
    <head>
      <meta charset="utf-8">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <meta name="supported-color-schemes" content="light">
      <title>Success Email</title>
    </head>

    <body>
    <style>
      body{
        font-family: 'MS Sans Serif';
      }
      @media (prefers-color-scheme: dark) {
        [data-ogsc] footer{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        background-color: white;
        padding: 1rem 1rem;
        height: fit-content;
        border-top: .4px solid rgba(23,31,42, 0.4);
        margin-top: 1rem;
      }
      [data-ogsc] .full-email-container{
      background-color: #E5E5E5;
      padding: 0 1rem 0rem 1rem;
      width: 400px;
      margin: 0 auto;
      }
      @media (min-width:768px) {

        .full-email-container {
          width: 600px;
        }
        .order-summary-container{
          width: 90%;
        }
      }
      .banner-container{
        width: 100%;
        position: relative;
      }
      .banner-container img{
        object-fit: contain;
        width: 100%;
      }
      .banner-container content{
      width: 100%;
      height: 100%;
      position: relative;
      }
      .banner-container .overlay{
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      background: linear-gradient(180deg,rgba(88,104,113,0) 50%,#21436e 92%);

      }
      [data-ogsc] .banner-container .text-container{
      position: absolute;
      color: white;
      bottom: 10%;
      left: 25px;
      font-size: 1.4rem;
      text-align: center;
      width: 350px;
    }
    @media (min-width: 768px){
      [data-ogsc] .banner-container .text-container{
        left: 125px;
        font-size: 2rem;
        }
      }
      [data-ogsc] .order-details-container{
      text-align: center;
      margin: 1rem auto;
      }
      [data-ogsc] .order-details-container .order-details-header{
        color: #233142;
        font-size: .75rem;
      }
      [data-ogsc] .order-details-container .order-number{
        color: #233142;
        font-size: 1.5rem;
        margin: .5rem auto;
        font-weight: 900;
      }
      [data-ogsc] .order-details-container .order-id{
        color: #233142;
        font-size: 1.2rem;
        /* margin: .5rem auto; */
      }
      [data-ogsc] .email-body-container{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #fff !important;
      }
      [data-ogsc] .order-summary-container .modal-summary-container{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      [data-ogsc] .order-summary-container .modal-summary-container .summary{
        text-align: center;
        margin: .5rem auto;
        color: #233142 !important;
        font-size: 1.4rem;
        border-top: .4px solid rgba(23,31,42, 0.4);
        width: 100%;
        padding-top: 1rem;
      }
      [data-ogsc] .order-summary-container .modal-summary-container .unit-header-container{
        margin: auto auto .5rem;
        border-bottom: .4px solid rgba(23,31,42, 0.4);
        width: 100%;
        padding-bottom: 1rem;
      }

      [data-ogsc] .unit-header-container .header{
        text-align: center;
        color: #233142;
        font-size: 1.5rem;
        padding-bottom: .5rem;
      }
      [data-ogsc] .modal-details-container{
        width: 100%;
      }
      [data-ogsc] .modal-details-container .content{
        padding: 1rem 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-direction: row;
        font-size: .9rem;
      }
      [data-ogsc] .modal-details-container .content-total{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        font-size: 1.2rem;
        border-top: .4px solid rgba(23,31,42, 0.4);
        padding: 1.3rem 0;
        border-bottom: .4px solid rgba(23,31,42, 0.4);
      }
      @media (min-width: 768px){
        [data-ogsc] .modal-details-container .content{
          font-size:1.2rem;
        }
        [data-ogsc] .modal-details-container .content-total{
          font-size:1.5rem;
        }
      }
      [data-ogsc] .download-btn-container{
        padding: 1rem 1rem;
        width: 50%;
        background-color: #21436E !important;
        color: white;
        text-align: center;
        display: -webkit-flex;
        display: flex;
        -webkit-justify-content: center;
        justify-content: center;
        -webkit-align-items: center;
        align-items: center;
        margin: 1.5rem auto 1.5rem;
      }
      [data-ogsc] .download-btn-container img{
        margin-right: 9px;
      }
      [data-ogsc] .contact-us-container {
        text-align: center;
        margin: .75rem auto;
      }
      [data-ogsc] .contact-us-container .header{
        font-weight: 900;
        margin-bottom: .5rem;
        font-size: 1.2rem;
      }
      [data-ogsc] .contact-us-container .sub{
        font-size: .8rem;
      }
      [data-ogsc] .links .link img{
        height: 1.3rem;
        width: 1.3rem;
        margin:  .4rem;
      }
    }
      footer{
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        background-color: white;
        padding: 1rem 1rem;
        height: fit-content;
        border-top: .4px solid rgba(23,31,42, 0.4);
        margin-top: 1rem;
      }
      .full-email-container{
      background-color: #E5E5E5;
      padding: 0 1rem 0rem 1rem;
      width: 400px;
      margin: 0 auto;
      }
      @media (min-width:768px) {

        .full-email-container {
          width: 600px;
        }
        .order-summary-container{
          width: 90%;
        }
      }
      .banner-container{
        width: 100%;
        position: relative;
      }
      .banner-container img{
        object-fit: contain;
        width: 100%;
      }
      .banner-container content{
        width: 100%;
        height: 100%;
        position: relative;
      }
      .banner-container .overlay{
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background: linear-gradient(180deg, rgba(196, 196, 196, 0) 0%, rgba(33, 67, 111, 0.9) 100%);
      }
      .banner-container .text-container{
      position: absolute;
      color: white;
      bottom: 10%;
      left: 25px;
      font-size: 1.4rem;
      text-align: center;
      width: 350px;
    }
    @media (min-width: 768px){
      .banner-container .text-container{
        left: 125px;
        font-size: 2rem;
        }
      }
      .order-details-container{
      text-align: center;
      margin: 1rem auto;
      }
      .order-details-container .order-details-header{
        color: #233142;
        font-size: .75rem;
      }
      .order-details-container .order-number{
        color: #233142;
        font-size: 1.5rem;
        margin: .5rem auto;
        font-weight: 900;
      }
      .order-details-container .order-id{
        color: #233142;
        font-size: 1.2rem;
        /* margin: .5rem auto; */
      }
      .email-body-container{
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: #fff !important;
      }
      .order-summary-container .modal-summary-container{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      .order-summary-container .modal-summary-container .summary{
        text-align: center;
        margin: .5rem auto;
        color: #233142 !important;
        font-size: 1.4rem;
        border-top: .4px solid rgba(23,31,42, 0.4);
        width: 100%;
        padding-top: 1rem;
      }
      .order-summary-container .modal-summary-container .unit-header-container{
        margin: auto auto .5rem;
        border-bottom: .4px solid rgba(23,31,42, 0.4);
        width: 100%;
        padding-bottom: 1rem;
      }

      .unit-header-container .header{
        text-align: center;
        color: #233142;
        font-size: 1.5rem;
        padding-bottom: .5rem;
      }
      .modal-details-container{
        width: 100%;
      }
      .modal-details-container .content{
        padding: 1rem 0;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        flex-direction: row;
        font-size: .9rem;
      }
      .modal-details-container .content-total{
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        font-size: 1.2rem;
        border-top: .4px solid rgba(23,31,42, 0.4);
        padding: 1.3rem 0;
        border-bottom: .4px solid rgba(23,31,42, 0.4);
      }
      @media (min-width: 768px){
        .modal-details-container .content{
          font-size:1.2rem;
        }
        .modal-details-container .content-total{
          font-size:1.5rem;
        }
      }
      .download-btn-container{
        padding: 1rem 1rem;
        width: 50%;
        background-color: #21436E !important;
        color: white;
        text-align: center;
        display: -webkit-flex;
        display: flex;
        -webkit-justify-content: center;
        justify-content: center;
        -webkit-align-items: center;
        align-items: center;
        margin: 1.5rem auto 1.5rem;
      }
      .download-btn-container img{
        margin-right: 9px;
      }
      .contact-us-container {
        text-align: center;
        margin: .75rem auto;
      }
      .contact-us-container .header{
        font-weight: 900;
        margin-bottom: .5rem;
        font-size: 1.2rem;
      }
      .contact-us-container .sub{
        font-size: .8rem;
      }
      .links .link img{
        height: 1.3rem;
        width: 1.3rem;
        margin:  .4rem;
      }
    </style>
    <div class="full-email-container">
    <div class="banner-container">
      <div class="overlay"></div>
      <div class="content">
        <div class="logo-container">
          <img src="cid:logo1"/>
        </div>
        <div class="text-container">
          Thank you, {{name}}!<br />
          for booking your next home at makadi
        </div>
      </div>
    </div>

    <div class="email-body-container">
      <div class="order-details-container">
      <div class="order-details-header">ORDER DETAILS</div>
      <div class="order-number">ORDER NUMBER</div>
      <div class="order-id">{{id}}</div>
      </div>
      <div class="order-summary-container">
      <div class="modal-summary-container">
        <div class="summary diodrum">Your order summary</div>
        <div class="unit-header-container">
        <div class="header diodrum">
          {{unitName}} At {{zoneName}} :<br /> Makadi Heights
        </div>
        </div>
        <div class="modal-details-container">
        <div class="content">
          <div class="title diodrum">Total Value</div>
          <div class="data diodrum">{{totalUnitPrice}} EGP</div>
        </div>
        <div class="content">
          <div class="title diodrum">Advance amount</div>
          <div class="data diodrum">{{downPayment}} EGP</div>
        </div>
        <div class="content">
          <div class="title diodrum">Due Amount After payment</div>
          <div class="data diodrum">{{dueAmount}} EGP</div>
        </div>
        <div class="content">
          <div class="title diodrum">Service tax 5%</div>
          <div class="data diodrum">{{tax}} EGP</div>
        </div>
        <div class="content-total">
          <div class="title diodrum">AMOUNT DUE</div>
          <div class="data diodrum">{{downPayment}} EGP</div>
        </div>
        </div>
      </div>

      </div>
      <div class="download-btn-container">
      <img src="cid:download" alt="">
      Download Receipt
      </div>
      <div class="contact-us-container">
      <div class="header">Contact us</div>
      <div class="sub">Singel 459, 1012 WP Amsterdam, The Netherlands</div>
      </div>
      <div class="contact-us-container">
      <div class="header">Follow us</div>
      <div class="links">
        <a href="" class="link"><img src="cid:facebook" alt=""></a>
        <a href="" class="link"><img src="cid:twitter" alt=""></a>
        <a href="" class="link"><img src="cid:instagram" alt=""></a>
      </div>
      </div>
    </div>
    <footer>
      <div>&copy; 2022 Makadi Heights</div>
      <div>Terms and conditions</div>
    </footer>
    </div>
    </body>

    </html>`
}
