var express = require('express');
var router = express.Router();
var {
  checkUrl,
  APP_URL,
  API_URL,
  ISSUER_BASE_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  SAML_PK,
  SESSION_SECRET,
  PORT,
  M2M_CLIENT,
  M2M_SECRET
} = require("../env-config");

var ManagementClient = require('auth0').ManagementClient;
var auth0 = new ManagementClient({
  domain: ISSUER_BASE_URL,
  clientId: M2M_CLIENT,
  clientSecret: M2M_SECRET
});

/* GET home page. */
router.get('/', async function(req, res, next) {
  var clientApp = await auth0.getClient({client_id: CLIENT_ID});
  var samlSettings = clientApp.addons.samlp;
  res.render('index', { title: 'Auth0 SAML Demo', samlSettings: JSON.stringify(samlSettings, null, 4) });
});

module.exports = router;
