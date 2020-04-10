/*
 * Primary file for the API
 *
 */

"use strict";

//Dependencies
var server = require("./lib/server");

var app = {};

app.init = function() {
  server.init();
};

// Execute the function
app.init();

module.exports = app;
