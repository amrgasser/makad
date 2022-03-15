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
        // link: `http://localhost:3000/payments/${entity.id}`
        link: `https://dev.makadi-heights.beyond-creation.net/payments/${entity.id}`
      };
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
    <title>Success Email</title>

    <style>
      @media (prefers-color-scheme: dark) {
        footer {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          background-color: white;
          padding: 1rem 1rem;
          height: fit-content;
          border-top: 0.4px solid rgba(23, 31, 42, 0.4);
          margin-top: 1rem;
        }
        .full-email-container {
          background-color: #e5e5e5;
          padding: 0 1rem 0rem 1rem;
          width: 400px;
          margin: 0 auto;
        }
        @media (min-width: 768px) {
          .full-email-container {
            width: 600px;
          }
          .order-summary-container {
            width: 90%;
          }
        }
        .banner-container {
          width: 100%;
        }
        .banner-container content {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .banner-container image-container {
          object-fit: contain;
          width: 100%;
        }
        .banner-container .overlay {
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          background: linear-gradient(
            180deg,
            rgba(88, 104, 113, 0) 50%,
            #21436e 92%
          );
        }
        .banner-container .text-container {
          position: absolute;
          color: white;
          bottom: 10%;
          left: 25px;
          font-size: 1.4rem;
          text-align: center;
          width: 350px;
        }
        .order-details-container {
          text-align: justify;
          margin: 1rem auto;
        }
        .order-details-container .order-details-header {
          color: #233142;
          font-size: 1.1rem;
          padding-left: 2rem;
          font-weight: 900;
        }
        .order-details-container .order-number {
          color: #233142;
          font-size: 1.3rem;
          padding: 2rem 2rem 0;
          text-align: justify;
        }
        .order-details-container .order-id {
          color: #233142;
          font-size: 1.2rem;
          /* margin: .5rem auto; */
        }
        .email-body-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #fff !important;
        }
        .order-summary-container .modal-summary-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .order-summary-container .modal-summary-container .summary {
          text-align: center;
          margin: 0.5rem auto;
          color: #233142 !important;
          font-size: 1.4rem;
          border-top: 0.4px solid rgba(23, 31, 42, 0.4);
          width: 100%;
          padding-top: 1rem;
        }
        .order-summary-container
          .modal-summary-container
          .unit-header-container {
          margin: auto auto 0.5rem;
          border-bottom: 0.4px solid rgba(23, 31, 42, 0.4);
          width: 100%;
          padding-bottom: 1rem;
        }

        .unit-header-container .header {
          text-align: center;
          color: #233142;
          font-size: 1.5rem;
          padding-bottom: 0.5rem;
        }
        .modal-details-container {
          width: 100%;
        }
        .modal-details-container .content {
          padding: 1rem 0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-direction: row;
          font-size: 0.9rem;
        }
        .modal-details-container .content-total {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          font-size: 1.2rem;
          border-top: 0.4px solid rgba(23, 31, 42, 0.4);
          padding: 1.3rem 0;
          border-bottom: 0.4px solid rgba(23, 31, 42, 0.4);
        }
        @media (min-width: 768px) {
          .modal-details-container .content {
            font-size: 1.2rem;
          }
          .modal-details-container .content-total {
            font-size: 1.5rem;
          }
        }
        .download-btn-container {
          padding: 1rem 1rem;
          width: 50%;
          background-color: #21436e !important;
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
        .download-btn-container img {
          margin-right: 9px;
        }
        .contact-us-container {
          text-align: center;
          margin: 0.75rem auto;
        }
        .contact-us-container .header {
          font-weight: 900;
          margin-bottom: 0.5rem;
          font-size: 1.2rem;
        }
        .contact-us-container .sub {
          font-size: 0.8rem;
        }
        .links .link img {
          height: 1.3rem;
          width: 1.3rem;
          margin: 0.4rem;
        }
      }
    </style>
  </head>
  <body style="background-color: white !important; font-family: 'arial'">
    <div
      class="full-email-container"
      style="
        background-color: #e5e5e5;
        padding: 1rem;
        width: 600px;
        max-width: 90%;
        margin: 0rem auto;
      "
    >
      <div
        class="banner-container"
        style="background-image: url('{{bannerurl}}'); width: 100%;
        position: relative;
        height: 25rem;
        background-size: cover;
        background-position: center center;
        background-repeat: no-repeat;"
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
          <div
            class="text-container"
            style="
              color: white !important;
              position: absolute;
              top: 85%;
              left: 50%;
              font-size: 1.2rem;
              width: 100%;
              text-align: center;
              transform: translate(-50%, -50%);
              bottom: auto;
              font-size: 2rem;
            "
          >
            Hello, {{name}}!<br />
            Your booking order is ready.
          </div>
        </div>
      </div>

      <div
        class="email-body-container"
        style="
          display:table-header-group;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #fff !important;
        "
      >
        <div
          class="order-details-container"
          style="text-align: center; margin: 1rem"
        >
          <div
            class="order-details-header"
            style="
              color: #233142;
              font-size: 1.1rem;
              text-align: left;
              font-weight: 900;
              margin-left: 1.5rem;
            "
          >
            Action Required:
          </div>
          <div
            class="order-number"
            style="
              color: #233142;
              font-size: 1.3rem;
              text-align: justify;
              padding: 1rem 1.5rem 0;
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
            padding: 1rem 1rem;
            width: 50%;
            background-color: #21436e !important;
            color: white;
            font-size: 1.5rem;
            text-align: center;
            text-decoration: none;
            display: block;
            margin: 1.5rem auto 1.5rem;
            text-align: center;
          "
        >
          View & Pay
        </a>
        <div
          class="contact-us-container"
          style="text-align: center; margin: 0.75rem auto"
        >
          <div
            class="header"
            style="font-weight: 900; margin-bottom: 0.5rem; font-size: 1.2rem"
          >
            Contact us if you have any questions
          </div>
          <div class="sub" style="font-size: 0.8rem">
            16595, Nile City Towers, North Tower 12th Floor, 2005 A Corniche El
            Nil, Ramlet Boulaq
          </div>
          <br />
          <div class="sub" style="font-size: 0.8rem">
            info@makadiheights.com
          </div>
        </div>
        <div
          class="contact-us-container"
          style="text-align: center; margin: 0.75rem auto"
        >
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
                style="height: 1.3rem; width: 1.3rem; margin: 0.4rem"
            /></a>
          </div>
        </div>
      </div>
      <div class="footer"
        style="
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          background-color: white;
          padding: 1rem 1rem;
          height: fit-content;
          border-top: 0.4px solid rgba(23, 31, 42, 0.4);
          margin-top: 1rem;
        "
      >
        <div style="float:left">&copy; 2022 Makadi Heights</div>
        <div style="margin-left:auto">Terms and conditions</div>
      </div>
    </div>
  </body>
</html>
`
}
