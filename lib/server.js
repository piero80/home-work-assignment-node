"use strict";
/* Start up the http server */

// Dependencies
var http = require("http");
var url = require("url");
var StringDecoder = require("string_decoder").StringDecoder;
var handlers = require("./handlers");
var helpers = require("./helpers");
var config = require("./config");
var fs = require("fs");
var util = require("util");
var debug = util.debuglog("server");

const server = {};

//Istantiate HTTP Server
server.httpServer = http.createServer(function (req, res) {
  server.unifiedServer(req, res);
});

server.unifiedServer = function (req, res) {
  // Parse the url
  var parsedUrl = url.parse(req.url, true);
  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");
  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  //Get the headers as an object
  var headers = req.headers;
  // Get the payload,if any
  var decoder = new StringDecoder("utf-8");
  var buffer = "";
  req.on("data", function (data) {
    buffer += decoder.write(data);
  });
  req.on("end", function () {
    buffer += decoder.end();

    // If trimmed path available in routes object, return corresponding handler and store it in chosenHandler variable for further execution, if NOT available return notFound handler
    var chosenHandler =
      typeof routes[trimmedPath] !== "undefined"
        ? routes[trimmedPath]
        : handlers.notFound;

    // All data obtained from the request into an object to pass it to the handler
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer),
    };

    // Execute the chosen handler
    chosenHandler(data, function (statusCode, payload, contentType) {
      // Set default status code to 200 in case of not present or different type
      var statusCode = typeof statusCode == "number" ? statusCode : 200;

      // Set default payload value to empty object if not present
      var payload = typeof payload == "object" ? payload : {};

      // Convert payload object to JSON String
      var payloadString = JSON.stringify(payload);

      // Write the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);

      // Log Success or Error message to console

      // If the response is 200, print green, otherwise print red
      if (statusCode == 200) {
        debug(
          "\x1b[32m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
      } else {
        debug(
          "\x1b[31m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
      }
    });
  });
};

// Set routes object for route matching with pathname and further assignment of handler
var routes = {
  users: handlers.users,
  tokens: handlers.tokens,
  menu: handlers.menu,
  cart: handlers.cart,
  order: handlers.order,
};
// Create a function in the server Object that starts up the server in http and https
server.init = function () {
  // Start the HTTP server
  server.httpServer.listen(config.httpPort, function () {
    console.log("The HTTP server is running on port " + config.httpPort);
  });
};

// Export the server
module.exports = server;
