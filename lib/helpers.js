/*
 * Helpers for various tasks
 *
 */

// Dependencies
var config = require("./config");
var crypto = require("crypto");
const querystring = require("querystring");
const https = require("https");

// Container for all the helpers
var helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function (str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

// Create a SHA256 hash
helpers.hash = function (str) {
  if (typeof str == "string" && str.length > 0) {
    var hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function (strLength) {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : false;
  if (strLength) {
    // Define all the possible characters that could go into a string
    var possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";

    // Start the final string
    var str = "";
    for (let i = 1; i <= strLength; i++) {
      // Get a random charactert from the possibleCharacters string
      var randomCharacter = possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length)
      );
      // Append this character to the string
      str += randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

// Charge a credit card with Stripe
helpers.stripeCharge = function (amount, callback) {
  // validate parameters
  amount = typeof amount === "number" && amount > 0 ? amount : false;

  console.log(amount);

  if (amount) {
    // Configure the request payload
    let payload = {
      amount: parseInt(amount.toFixed(2) * 100),
      currency: "usd",
      source: "tok_amex",
    };

    // Stringfy the payload
    let stringPayload = querystring.stringify(payload);

    // Configure the request details
    let requestDetails = {
      protocol: "https:",
      hostname: "api.stripe.com",
      method: "POST",
      path: "/v1/charges",
      auth: "sk_test_4eC39HqLyjWDarjtT1zdp7dc:",
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
        "Content-length": Buffer.byteLength(stringPayload),
      },
    };

    // Instantiate the request object
    let req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      let status = res.statusCode;

      // Used for debug
      // res.setEncoding('utf8');
      // res.on('data', function (data) {
      //     console.log('Result from Stripe: ' + data);
      // });

      // Callback successfuly if the request went through
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback("Status code returned was " + status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on("error", (e) => {
      callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    callback("Given parameters are missing or invalid.");
  }
};

// Charge a credit card with Stripe
helpers.mailgunSendEmail = function (
  toEmail,
  toName,
  subject,
  message,
  callback
) {
  // validate parameters
  let emailRegex = /\S+@\S+\.\S+/;
  toEmail =
    typeof toEmail === "string" && emailRegex.test(toEmail)
      ? toEmail.trim()
      : false;
  toName =
    typeof toName === "string" && toName.trim().length > 2
      ? toName.trim()
      : false;
  subject =
    typeof subject === "string" && subject.trim().length > 2
      ? subject.trim()
      : false;
  message =
    typeof message === "string" && message.trim().length > 2
      ? message.trim()
      : false;

  if (toEmail && toName && message) {
    // Configure the request payload
    let payload = {
      from:
        "Pizza App <postmaster@sandboxa6baac78a4a64957987ab25d9b397b30.mailgun.org>",
      to: toEmail,
      subject: subject,
      text: message,
    };

    // Stringfy the payload
    let stringPayload = querystring.stringify(payload);

    // Configure the request details
    let requestDetails = {
      protocol: "https:",
      hostname: "api.mailgun.net",
      method: "POST",
      path: "/v3/sandboxa6baac78a4a64957987ab25d9b397b30.mailgun.org/messages",
      auth: config.mailgunCredential,
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
        "Content-length": Buffer.byteLength(stringPayload),
      },
    };

    // Instantiate the request object
    let req = https.request(requestDetails, (res) => {
      // Grab the status of the sent request
      let status = res.statusCode;

      // Callback successfuly if the request went through
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback("Status code returned was " + status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on("error", (e) => {
      callback(e);
    });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    callback("Given parameters are missing or invalid.");
  }
};

// Export the module
module.exports = helpers;
