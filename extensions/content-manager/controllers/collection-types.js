'use strict';

const { getService, wrapBadRequest, pickWritableAttributes } = require('../../../node_modules/strapi-plugin-content-manager/utils');
// const { getService, wrapBadRequest, pickWritableAttributes } = require('strapi-plugin-content-manager/utils');
// const { validateBulkDeleteInput, validatePagination } = require('../../../node_modules/strapi-plugin-content-manager/validation');
var nodemailer = require('nodemailer');
const hbs = require('handlebars')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'amr.r.gasser@gmail.com',
    pass: 'xthioibjcuiflcjg'
  }
});

module.exports = {

  async publish(ctx) {
    console.log('publish from extensions');
    const { userAbility } = ctx.state;
    const { id, model } = ctx.params;

    const entityManager = getService('entity-manager');
    const permissionChecker = getService('permission-checker').create({ userAbility, model });

    if (permissionChecker.cannot.publish()) {
      return ctx.forbidden();
    }


    const entity = await entityManager.findOneWithCreatorRoles(id, model);

    if (model === 'application::payments.payments') {
      console.log(entity);
      var template = hbs.compile(emailTemplate.html);
      var replacements = {
        name: entity.firstName,
        id: entity.id,
        unitName: entity.unit.unitName,
        zoneName: entity.zone.zoneName,
        bannerurl: entity.unit.exteriorImages[0].image[0].url,
        logourl: entity.zone.bannerSection.logoImg.url,
        // link: `http://localhost:3000/payments/${entity.id}`
        link: `https://dev.makadi-heights.beyond-creation.net/payments/${entity.id}`
      };
      console.log( replacements.bannerurl );
      var htmlToSend = template(replacements);
      var mailOptions = {
        from: 'no-reply from @makadiheights.com <noreply@makadiheights.com>',
        to: entity.email,
        subject: 'Action Required: Payment Notice',
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
    }

    if (!entity) {
      return ctx.notFound();
    }

    if (permissionChecker.cannot.publish(entity)) {
      return ctx.forbidden();
    }

    const result = await entityManager.publish(entity, model);

    ctx.body = permissionChecker.sanitizeOutput(result);
  },
};


const emailTemplate = {
  subject: 'Makadi Height Payment',
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
        color: #233142!important;
        font-family: 'arial';
      }
      @media (max-width: 767px) {
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
          font-size: 1.2rem!important;
        }
      }
    </style>
  </head>
  <body style="background-color: white !important; font-family: 'arial'">
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
          height: 25rem;
          width: 100%;
          position: relative;
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
          <div style="width: 100%">
            <div class="logo-container">
              <img
                src="{{logourl}}"
                style="
                  padding: 3rem 2rem;
                  background-color: #fff;
                  width: 100px;
                  margin-top: 10rem;
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
      </div>

      <div
        class="email-body-container"
        style="
          display: block;
          background-color: #fff !important;
          width: 100%;
          padding-bottom:2.5rem;
        "
      >
        <div
          class="text-container"
          style="font-size: 2rem; padding: 2.5rem 2.5rem 0; font-weight: 800"
        >
          Thanks for your order, {{name}}
        </div>
        <div
          class="order-details-container"
          style="text-align: center; margin: 1rem"
        >
          <div
            class="order-number"
            style="
              color: #233142;
              font-size: 1.1rem;
              text-align: left;
              padding: 1.5rem 1.5rem 0;
            "
          >
            Please review your booking details. Once you’ve double checked your
            booking details, make sure you pay the booking amount to keep the
            unit locked for you. Otherwise, the payment link will expire in an
            hour and the unit will be made available to other customers.
          </div>
        </div>
        <a
          class="download-btn-container"
          href="{{link}}"
          style="
            padding: 1rem 0.5rem;
            width: 40%;
            background-color: #fff;
            border: 1px solid #21436e;
            color: #21436e;
            font-size: 1.5rem;
            text-align: center;
            text-decoration: none;
            display: block;
            margin: 2.5rem;
            text-align: center;
          "
        >
          View & Pay
        </a>
        <div
          class="contact-us-container"
          style="text-align: lef; margin: 0.75rem 2rem"
        >
          <div class="sub" style="font-size: 0.875rem; margin-bottom: 0.3rem">
            Nile City Towers, North Tower 12th Floor, 2005 A Corniche El Nil,
            Ramlet Boulaq
          </div>
          <div class="sub" style="font-size: 0.875rem">
            info@makadiheights.com
          </div>
        </div>
        <div class="contact-us-container" style="margin: 0.75rem 2rem">
          <div
            class="header"
            style="font-weight: 900; margin-bottom: 0.5rem; font-size: 1.3rem"
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
                style="height: 1.3rem; width: 1.3rem; margin: 0.4rem"
            /></a>
          </div>
        </div>
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
