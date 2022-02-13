'use strict';
const querystring = require("querystring");
const { Curl } = require("node-libcurl");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  generatePaymentLink: async (ctx) => {
    const curlTest = new Curl();
    const terminate = curlTest.close.bind(curlTest);
    let dataresponse = []
    const url = "https://securepayments.alrajhibank.com.sa/pg/payment/hosted.htm";

    curlTest.setOpt(Curl.option.URL, url)
    curlTest.setOpt(Curl.option.VERBOSE, true)
    curlTest.setOpt(Curl.option.SSL_VERIFYPEER, false)
    curlTest.setOpt(Curl.option.POST, 1)
    curlTest.setOpt(Curl.option.HEADER, ['Content-Type: application/json', 'charset: utf-8'])
    curlTest.setOpt(Curl.option.CONNECTTIMEOUT, 3)
    curlTest.setOpt(Curl.option.TIMEOUT, 20)
    // curlTest.setOpt(Curl.option.POSTFIELDS, ctx.request.body)

    curlTest.on("end", (statusCode, data, headers) => {
      dataresponse = data
      return statusCode + "/n" + "Response: " + data + "/n Payment Successful"
    })
    curlTest.on("error", (e) => {
      console.log(e);
    })

    curlTest.perform();

    return dataresponse
  },
  find: async (ctx) => {
    return 'Hello World!';

  }
};
