
function beginGatewayRequest(body) {

  const curlTest = new Curl();
  const terminate = curlTest.close.bind(curlTest);
  const url = "https://securepayments.alrajhibank.com.sa/pg/payment/hosted.htm";

  curlTest.setOpt(Curl.option.URL, url)
  curlTest.setOpt(Curl.option.VERBOSE, true)
  curlTest.setOpt(Curl.option.SSL_VERIFYPEER, false)
  // curlTest.setOpt(Curl.option.r)
  curlTest.setOpt(Curl.option.POST, 1)
  curlTest.setOpt(Curl.option.HEADER, ['Content-Type: application/json', 'charset: utf-8', 'Content-Length: ' + body.length])
  curlTest.setOpt(Curl.option.CONNECTTIMEOUT, 3)
  curlTest.setOpt(Curl.option.TIMEOUT, 20)
  curlTest.setOpt(Curl.option.POSTFIELDS, body)

  curlTest.on("end", (statusCode, data, headers) => {
    console.log("Ended Succesfuly\n " + "Status Code: " + statusCode);
    console.log("Data: \n" + data);
    // console.log(data);
    return data
  })
  curlTest.on("error", (e) => {
    console.log(e.message);
    return "Error";
  })

  let dataresponse = curlTest.perform();
  curlTest.close()

  return dataresponse
}

async function beginGatewayRequest2(body) {

  const url = "securepayments.alrajhibank.com.sa";
  let dataresponse = "not changed"
  const options = {
    hostname: url,
    path: '/pg/payment/hosted.htm',
    method: 'POST',
    // port: 443,
    body: body,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  };
  const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      console.log(`BODY: ${chunk}`);
    });
    res.on('end', () => {
      console.log('No more data in response.');

    });
    console.log("end of request, \n", res);
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
    return e.message
  });

  // Write data to request body
  // req.write(body);
  req.end();

  return "asd"
}
