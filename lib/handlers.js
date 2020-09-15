/*
 * Request Handlers
 *
 */

// Dependencies
var _data = require("./data");
var helpers = require("./helpers");
var menuItems = require("./items");
// Define all the handlers
var handlers = {};
// Ping
handlers.ping = function (data, callback) {
  callback(200);
};

// Not-Found
handlers.notFound = function (data, callback) {
  callback(404);
};

handlers.users = function (data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Container for all the users methods
handlers._users = {};

// Users - post
// Required data: name, email, address
// Optional data: none
handlers._users.post = function (data, callback) {
  var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0
      ? data.payload.email.trim()
      : false;
  var address =
    typeof data.payload.address == "string" &&
    data.payload.address.trim().length > 0
      ? data.payload.address.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;
  if (firstName && lastName && email && address && password && tosAgreement) {
    _data.read("users", email, function (err, data) {
      if (err) {
        // Hash the password
        var hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          var userObject = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            address: address,
            hashedPassword: hashedPassword,
            tosAgreement: true,
            shoppingCart: [],
          };
          // Store the user
          _data.create("users", email, userObject, function (err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: "Could not create the new user" });
            }
          });
        } else {
          callback(500, {
            Error: "Could not hash the user's password.",
          });
        }
      } else {
        // User alread exists
        callback(400, {
          Error: "A user with that email already exists",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};
// Required data: email
// Optional data: none
handlers._users.get = function (data, callback) {
  console.log(data.queryStringObject);
  // Check that email is valid
  var email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0
      ? data.queryStringObject.email.trim()
      : false;
  if (email) {
    // Get token from headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", email, function (err, data) {
          if (!err && data) {
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid.",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Required data: email
// Optional data: firstName, lastName, password, address (at least one must be specified)
handlers._users.put = function (data, callback) {
  console.log(data);
  // Check for required field
  var email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0
      ? data.payload.email.trim()
      : false;

  var firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  var lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var address =
    typeof data.payload.address == "string" &&
    data.payload.address.trim().length > 0
      ? data.payload.address.trim()
      : false;
  if (email) {
    if (firstName || lastName || password || address) {
      // Get token from headers
      var token =
        typeof data.headers.token == "string" ? data.headers.token : false;

      // Verify that the given token is valid for the email
      handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
        if (tokenIsValid) {
          // Lookup the user
          _data.read("users", email, function (err, userData) {
            if (!err && userData) {
              // Update the fields if necessary
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              if (address) {
                userData.address = address;
              }
              // Store the new updates
              _data.update("users", email, userData, function (err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, {
                    Error: "Could not update the user.",
                  });
                }
              });
            } else {
              callback(400, {
                Error: "Specified user does not exist.",
              });
            }
          });
        } else {
          callback(403, {
            Error: "Missing required token in header, or token is invalid.",
          });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update." });
    }
  } else {
    callback(400, { Error: "Missing required field." });
  }
};
// Required data: email
// Cleanup old checks associated with the user
handlers._users.delete = function (data, callback) {
  // Check that email is valid
  var email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0
      ? data.queryStringObject.email.trim()
      : false;
  if (email) {
    // Get token from headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;

    // Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        // Lookup the user
        _data.read("users", email, function (err, userData) {
          if (!err && userData) {
            // Delete the user's data
            _data.delete("users", email, function (err) {
              if (err) {
                callback(500, {
                  Error: "Could not delete user!",
                });
              } else {
                callback(200);
              }
            });
          } else {
            callback(400, {
              Error: "Could not find the specified user.",
            });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid.",
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};
// Container for all the tokens methods
handlers._tokens = {};
// Tokens
handlers.tokens = function (data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Tokens - post
// Required data: email, password
// Optional data: none
handlers._tokens.post = function (data, callback) {
  // validate parameters
  var email =
    typeof data.payload.email == "string" &&
    data.payload.email.trim().length > 0
      ? data.payload.email.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (email && password) {
    // Lookup the user who matches that phone number
    _data.read("users", email, function (err, userData) {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid, create a new token with a random name. Set an expiration date 1 hour in the future.
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            email: email,
            id: tokenId,
            expires: expires,
          };
          //console.log(tokenObject);
          // Store the token
          _data.create("tokens", tokenId, tokenObject, function (err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { Error: "Could not create the new token" });
            }
          });
        } else {
          callback(400, {
            Error: "Name did not match the specified user's stored password",
          });
        }
      } else {
        callback(400, { Error: "Could not find the specified user." });
      }
    });
  } else {
    callback(400, { Error: "Missing required field(s)." });
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = function (data, callback) {
  // Check that id is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  console.log(id);
  if (id) {
    // Lookup the token
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field, or field invalid" });
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = function (data, callback) {
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  var extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;
  if (id && extend) {
    // Lookup the existing token
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        // Check to make sure the token isn't already expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          // Store the new updates
          _data.update("tokens", id, tokenData, function (err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not update the token's expiration.",
              });
            }
          });
        } else {
          callback(400, {
            Error: "The token has already expired, and cannot be extended.",
          });
        }
      } else {
        callback(400, { Error: "Specified user does not exist." });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required field(s) or field(s) are invalid.",
    });
  }
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = function (data, callback) {
  // Check that id is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    // Lookup the token
    _data.read("tokens", id, function (err, tokenData) {
      if (!err && tokenData) {
        // Delete the token
        _data.delete("tokens", id, function (err) {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified token" });
          }
        });
      } else {
        callback(400, { Error: "Could not find the specified token." });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, email, callback) {
  // Lookup the token
  _data.read("tokens", id, function (err, tokenData) {
    if (!err && tokenData) {
      // Check that the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Container for all the menu methods
handlers._menu = {};
// Menu
handlers.menu = function (data, callback) {
  var acceptableMethods = ["get"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Menu - get
// Required data: email
// Optional data: none
handlers._menu.get = function (data, callback) {
  // check if email is valid
  var email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0
      ? data.queryStringObject.email.trim()
      : false;
  if (email) {
    // Get the token that sent the request
    var token =
      typeof data.headers.token === "string" ? data.headers.token : false;
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        callback(200, menuItems);
      } else {
        callback(403, { Error: "Token invalid" });
      }
    });
  } else {
    callback(400, { Error: "Missing email" });
  }
};

handlers._menu.find = (id) => {
  return menuItems.find((el) => {
    return el.id == id.toString();
  });
};

// Container for all the Carty
handlers._cart = {};
// Cart
handlers.cart = function (data, callback) {
  var acceptableMethods = ["get", "post", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._cart[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Requires `token` header for authentication
handlers._cart.get = function (data, callback) {
  // check if email is valid
  var email =
    typeof data.queryStringObject.email == "string" &&
    data.queryStringObject.email.trim().length > 0
      ? data.queryStringObject.email.trim()
      : false;
  if (email) {
    // Get the token that sent the request
    var token =
      typeof data.headers.token === "string" ? data.headers.token : false;
    handlers._tokens.verifyToken(token, email, function (tokenIsValid) {
      if (tokenIsValid) {
        // lookup cart
        _data.read("carts", email, (err, cartData) => {
          console.log(cartData);
          if (
            !err &&
            cartData &&
            cartData.items !== undefined &&
            cartData.items.length > 0
          ) {
            callback(200, cartData);
          } else {
            callback(400, { Error: "Cart is empty!" });
          }
        });
      } else {
        callback(403, { Error: "Token invalid" });
      }
    });
  } else {
    callback(400, { Error: "Missing email" });
  }
};

// Requires `token` header for authentication
handlers._cart.post = function (data, callback) {
  // validate inputs
  let menuItemId =
    typeof data.payload.menuItemId === "number" &&
    data.payload.menuItemId % 1 == 0
      ? data.payload.menuItemId
      : false;
  let quantity =
    typeof data.payload.quantity === "number" &&
    data.payload.quantity % 1 == 0 &&
    data.payload.quantity > 0
      ? data.payload.quantity
      : false;

  if (menuItemId && quantity) {
    // Get the token from the headers
    let token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Lookup the user by reading the token
    _data.read("tokens", token, function (err, tokenData) {
      if (!err && tokenData) {
        let userEmail = tokenData.email;
        // Lookup the user data
        _data.read("users", userEmail, function (err, userData) {
          if (!err && userData) {
            let cartItems =
              typeof userData.cartItems == "object" &&
              userData.cartItems instanceof Array
                ? userData.cartItems
                : [];

            let newCartItem = {
              menuItemId: menuItemId,
              quantity: quantity,
            };

            // Add the item to user's cart
            userData.cartItems = cartItems;
            userData.cartItems.push(newCartItem);

            // Save the new user data
            _data.update("users", userEmail, userData, (err) => {
              if (!err) {
                // Return the data about the new check
                callback(200);
              } else {
                callback(500, {
                  Error: "Could not update the user with the new cart item.",
                });
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required inputs, or inputs are invalid." });
  }
};

handlers._cart.delete = function (data, callback) {
  let menuItemId = parseInt(data.queryStringObject.menuItemId);
  // Check that the id is valid
  menuItemId =
    data.queryStringObject.menuItemId > 0
      ? data.queryStringObject.menuItemId
      : false;
  if (menuItemId) {
    let token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    // Lookup the user by reading the token
    _data.read("tokens", token, function (err, tokenData) {
      if (!err && tokenData) {
        let userEmail = tokenData.email;

        // Lookup the user data
        _data.read("users", userEmail, function (err, userData) {
          if (!err && userData) {
            let cartItems =
              typeof userData.cartItems == "object" &&
              userData.cartItems instanceof Array
                ? userData.cartItems
                : [];
            if (cartItems.length > 0) {
              // Filter out this menu item from user's cart
              let updatedCartItems = cartItems.filter(
                (item) => item.menuItemId != menuItemId
              );
              userData.cartItems = updatedCartItems;
              // Save the new user data
              _data.update("users", userEmail, userData, (err) => {
                if (!err) {
                  // Return the data about the new check
                  callback(200);
                } else {
                  callback(500, {
                    Error: "Could not update the user with the new cart item.",
                  });
                }
              });
            } else {
              callback(400, {
                Error: "Could not delete item because cart is already empty.",
              });
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403);
      }
    });
  } else {
    callback(400, { Error: "Missing required field." });
  }
};

/*ORDER*/
handlers._order = {};
// Cart
handlers.order = function (data, callback) {
  var acceptableMethods = ["post"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._order[data.method](data, callback);
  } else {
    callback(405);
  }
};
// Orders - post
// Required data: none
// Optional data: none
handlers._order.post = function (data, callback) {
  // Get the token from the headers
  let token =
    typeof data.headers.token == "string" ? data.headers.token : false;
  _data.read("token", token, function (err, tokenData) {
    if (!err && tokenData) {
      let userEmail = tokenData.email;
      // Lookup the user data
      _data.read("users", userEmail, function (err, userData) {
        if (!err && userData) {
          let cartItems =
            typeof userData.cartItems == "object" &&
            userData.cartItems instanceof Array
              ? userData.cartItems
              : [];
          if (cartItems.length > 0) {
            let totalAmount = 0;
            for (let index = 0; index < cartItems.length; index++) {
              const el = cartItems[index];
              for (let i = 0; i < menuItems.length; i++) {
                const item = menuItems[i];
                if (el.menuItemId == item.id) {
                  // Calculates the total of this item based on the quantity
                  totalAmount += item.price * el.quantity;
                  console.log(totalAmount);
                }
              }
            }
          }
        }
      });
    }
  });
};

// Export the handlers
module.exports = handlers;
