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
          bannerurl: entity.unit.exteriorImages[0].image[0].url,
          price: entity.unit.price,
          propertySize: entity.unit.propertySize,
          bathrooms: entity.unit.bathrooms,
          beds: entity.unit.beds,
          terraces: entity.unit.terraces,
          bua: entity.unit.bua,
          logourl: entity.zone.bannerSection.logoImg.url,
        };
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: 'no-reply from @makadiheights.com <noreply@makadiheights.com>',
          to: entity.email,
          subject: 'Order Receipt',
          html: htmlToSend,
          attachments: [
            {
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

    const homeAtMakadi = await strapi.services['home-at-makadi-heights'].find()
    console.log(homeAtMakadi);
    const zoneDescription = homeAtMakadi.zones.filter((zone) => zone.Name.toLowerCase() == entity.zone.zoneName.toLowerCase() ? zone.bottomDescription : "")

    const faqs = await strapi.services.faq.find()
    entity.zoneDescription = zoneDescription[0].bottomDescription
    entity.zoneImage = zoneDescription[0].bannerImg.url
    entity.faqs = faqs

    return sanitizeEntity(entity, { model: strapi.models.payments });
  }

};

const emailTemplate = {
  subject: 'Makadi Height Receipt',
  html: `<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Success Email</title>
    <style>
      body {
        color: #233142 !important;
        font-family: "arial";
      }
      .modal-summary-container .title,
      .modal-summary-container .data {
        font-size: 1rem;
        margin-bottom: 1rem;
        color: #999999;
      }
      .unit-desc {
        font-size: .8rem;
      }
      @media (max-width: 767px) {
        * {
          box-sizing: border-box;
        }
        .banner-container {
          height: 20rem !important;
        }
        .text-container {
          font-size: 1.2rem !important;
        }
        .logo-container img {
          margin-top: 10rem !important;
        }
        .header img {
          width: 40%;
        }
        .download-btn-container {
          font-size: 1.2rem !important;
          width: calc(100%) !important;
        }
        .unit-img {
          margin-bottom: 1rem!important;
        }
        .unit-desc {
          padding: 0 .7rem!important;
          text-align: center!important;
        }
        .unit-desc p {
          width: 50%!important;
          font-size: .6rem;
          line-height: .9;
        }
        .unit-desc p.zone-desc {
          width: 100%!important;
          font-size: .8rem;
        }
        .unit-desc p span {
          display: block!important;
          font-size: .6rem;
        }
        .unit-img,.unit-desc {
          width: 100%!important;
          float: none!important;
        }
        .modal-summary-container .title,
        .modal-summary-container .data {
          font-size: 0.7rem;
          margin-bottom: 0.5rem;
        }
      }
    </style>
  </head>
  <body>
    <div
      class="full-email-container"
      style="
        background-color: #bbbbbb;
        padding: 1rem;
        width: 600px;
        max-width: 90%;
        margin: 0rem auto;
      "
    >
      <div class="header" style="padding: 0 0 1rem">
        <img
          src="https://dev.makadi-heights.beyond-creation.net/logoBig.png"
          width="30%"
          alt=""
          srcset=""
          style="float: left"
        />
        <div
          class="address"
          style="
            float: right;
            font-size: 0.7rem;
            text-align: right;
            color: #fff;
          "
        >
          <div class="need-help" style="margin-bottom: 0.2rem">
            Need help?
            <a
              target="_blank"
              href="https://dev.makadi-heights.beyond-creation.net/contact-us"
              style="color: #21436e; text-decoration: none"
              >Contact us</a
            >
          </div>
          Real Estate Inquiries: 16595
        </div>
        <div style="clear: both"></div>
      </div>
      <div
        class="banner-container"
        style="
          background-image: url('{{bannerurl}}');
          width: 100%;
          position: relative;
          height: 25rem;
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
        "
      >
        <div class="content">
          <div
            class="overlay"
            style="
              width: 100%;
              height: 100%;
              position: absolute;
              top: 0;
              left: 0;
              background: linear-gradient(
                180deg,
                rgba(196, 196, 196, 0) 0%,
                rgba(33, 67, 111, 0.9) 100%
              );
            "
          ></div>
        </div>
        <div style="width: 100%">
          <div class="logo-container">
            <img
              src="{{logourl}}"
              style="
                padding: 3rem 2rem;
                background-color: #fff;
                width: 100px;
                margin-top: 14rem;
                margin-right: 1rem;
                display: inline-block;
                float: right;
                z-index: 12;
                position: relative;
              "
            />
          </div>
        </div>
      </div>
      <div
        class="email-body-container"
        style="
          display: block;
          padding: 0 2rem;
          background-color: #fff !important;
        "
      >
        <div
          class="text-container"
          style="
            font-size: 1.2rem;
            padding: 2rem 0;
            font-weight: 800;
            border-bottom: 1px solid rgba(0, 56, 255, 0.2);
          "
        >
          ORDER NUMBER: {{id}}
        </div>
        <div
          class="summary"
          style="
            font-size: 1rem;
            border-bottom: 1px solid rgba(0, 56, 255, 0.2);
            padding: 1rem 0;
            text-align: center;
            font-weight: 800;
          "
        >
          <div
            class="order-summary"
            style="
              color: #999999;
              text-align: center;
              margin-bottom: 1rem;
              font-weight: 300;
            "
          >
            Order Summary
          </div>
          Your order {{unitName}} at {{zoneName}} : Makadi Heights
        </div>
        <div class="order-summary-container" style="padding: 1rem 0">
          <div class="modal-summary-container">
            <div class="title" style="float: left">Total value</div>
            <div class="data" style="float: right">EGP {{totalUnitPrice}}</div>
            <div style="clear: both"></div>
            <div class="title" style="float: left">Advance amount</div>
            <div class="data" style="float: right">EGP {{downPayment}}</div>
            <div style="clear: both"></div>
            <div class="title" style="float: left">
              Due amount after payment
            </div>
            <div class="data" style="float: right">EGP {{dueAmount}}</div>
            <div style="clear: both"></div>
            <div class="title" style="float: left">Service tax 5%</div>
            <div class="data" style="float: right">EGP {{tax}}</div>
            <div style="clear: both"></div>
            <div class="title" style="float: left">
              Amount Due <br />
              (Advance Amount)
            </div>
            <div class="data" style="float: right">EGP {{downPayment}}</div>
            <div style="clear: both"></div>
          </div>
          <div
            class="download-btn-container"
            style="
              padding: 1rem 0.5rem;
              width: 50%;
              background-color: #21436e;
              border: 1px solid #fff;
              color: #fff;
              font-size: 1.2rem;
              text-align: center;
              text-decoration: none;
              display: block;
              margin: 2rem 0;
              text-align: center;
            "
          >
            <img src="cid:download" alt="" />
            Download Receipt
          </div>
          <div
            class="contact-us-container"
            style="text-align: lef; margin: 0.75rem 0"
          >
            <div class="sub" style="font-size: 0.8rem; margin-bottom: 0.3rem">
              Nile City Towers, North Tower 12th Floor, 2005 A Corniche El Nil,
              Ramlet Boulaq
            </div>
            <div class="sub" style="font-size: 0.8rem">
              info@makadiheights.com
            </div>
          </div>
          <div class="contact-us-container" style="margin: 0.75rem 0">
            <div
              class="header"
              style="font-weight: 900; margin-bottom: 0.5rem; font-size: 1.2rem"
            >
              Follow us
            </div>
            <div class="links">
              <a href="" class="link"
                ><img
                  src="cid:facebook"
                  alt=""
                  style="height: 1.3rem; width: 1.3rem; margin: 0.4rem"
              /></a>
              <a href="" class="link"
                ><img
                  src="cid:twitter"
                  alt=""
                  style="height: 1.3rem; width: 1.3rem; margin: 0.4rem"
              /></a>
              <a href="" class="link"
                ><img
                  src="cid:instagram"
                  alt=""
                  style="
                    height: 1.3rem;
                    width: 1.3rem;
                    margin: 0.4rem;
                    margin-bottom: 0;
                  "
              /></a>
            </div>
          </div>
        </div>
      </div>

      <div
        class="explore"
        style="
          background-color: white;
          padding: 1rem;
          font-size: .9rem;
          margin-top: 1rem;
        "
      >
        <h3
          style="
            color: #233142;
            font-size: 1rem;
            margin: 0;
            margin-bottom: 1rem;
          "
        >
          Explore your new home
        </h3>
        <div class="unit-img" style="width: 49%; margin: 0; float: left">
          <img
            width="100%"
            src="{{bannerurl}}"
            alt=""
            srcset=""
            style="max-height: 200px;"
          />
        </div>
        <div
          class="unit-desc"
          style="width: 49%; padding-left: 1%; float: right"
        >
          <p
            style="
              width: 40%;
              padding-right: 1rem;
              float: left;
              border-right: 1px dotted #ddd;
              margin: 0;
            "
          >
            <span style="text-transform: uppercase; color: #999999"
              >Property Price</span
            >
            <br>
            L.E {{price}}
          </p>
          <p
            style="
              width: 45%;
              padding-left: 1rem;
              float: left;
              margin: 0;
            "
          >
            <span style="text-transform: uppercase; color: #999999"
              > Property Size</span
            >
            <br>
            {{propertySize}} m2
          </p>
          <div style="clear:both"></div>
          <p
            style="
              width: 40%;
              padding-right: 1rem;
              float: left;
              border-right: 1px dotted #ddd;
              margin: 0;
              margin-top: 1rem;
            "
          >
            <span style="text-transform: uppercase; color: #999999"
              >Bathrooms</span
            >
            <br>
            {{bathrooms}}
          </p>
          <p
            style="
              width: 45%;
              padding-left: 1rem;
              float: left;
              margin: 0;
              margin-top: 1rem;
            "
          >
            <span style="text-transform: uppercase; color: #999999"
              > BEDROOM</span
            >
            <br>
            {{beds}}
          </p>
          <div style="clear:both"></div>
          <p
            style="
              width: 40%;
              padding-right: 1rem;
              float: left;
              border-right: 1px dotted #ddd;
              margin: 0;
              margin-top: 1rem;
            "
          >
            <span style="text-transform: uppercase; color: #999999"
              >UNCOVERED TERACES</span
            >
            <br>
            {{terraces}}
          </p>
          <p
            style="
              width: 45%;
              padding-left: 1rem;
              float: left;
              margin: 0;
              margin-top: 1rem;
            "
          >
            <span style="text-transform: uppercase; color: #999999"
              > BUILT UP AREA</span
            >
            <br>
            {{bua}} m2
          </p>
          <div style="clear: both"></div>
        </div>
        <div style="clear: both"></div>
      </div>

      <div
        class="explore"
        style="
          background-color: white;
          padding: 1rem;
          font-size: 0.9rem;
          margin-top: 1rem;
        "
      >
        <h3
          style="
            color: #233142;
            font-size: 1rem;
            margin: 0;
            margin-bottom: 1rem;
          "
        >
        Explore your neighbourhood: {{zoneName}}
        </h3>
        <div class="unit-img" style="width: 49%; margin: 0; float: left">
          <img
            width="100%"
            src="https://res.cloudinary.com/doh4vcgwz/image/upload/v1644246698/Topio_1_2fd2098ae1.jpg"
            alt=""
            srcset=""
            height="160px"
          />
        </div>
        <div
          class="unit-desc"
          style="width: 49%; padding-left: 1%; float: right"
        >
          <h2 style="margin-top: 0;">
            {{zoneName}}
          </h2>
          <p class="zone-desc">
            Apartments, duplexes and floating chalets are designed with Boho-inspired architecture that features serenity on every floor
          </p>
          <a
          class="download-btn-container"
          href="https://dev.makadi-heights.beyond-creation.net/home-at-makadi"
          style="
            padding: .8rem;
            width: 50%;
            background-color: #21436e;
            border: 1px solid #fff;
            color: #fff;
            font-size: 1.1rem;
            text-align: center;
            text-decoration: none;
            display: block;
            margin: 1rem 0;
            text-align: center;
          "
        >
        Explore
        <img src="https://dev.makadi-heights.beyond-creation.net/orascom-circle.svg" style="display: inline;margin-left: 5px;color: #21436e;" width="17px" height="15px" alt="" srcset="">
        </a>
          <div style="clear: both"></div>
        </div>
        <div style="clear: both"></div>
      </div>

      <div
        class="footer"
        style="
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          background-color: white;
          padding: 1rem 1rem;
          height: fit-content;
          border-top: 0.4px solid rgba(23, 31, 42, 0.4);
          margin-top: 1rem;
          font-size: 0.8rem;
        "
      >
        <div style="float: left">&copy; 2022 Makadi Heights</div>
        <div style="margin-left: auto">Terms and conditions</div>
      </div>
    </div>
  </body>
</html>
`
}

