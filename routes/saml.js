var express = require('express');
var saml2 = require('saml2-js');
var fs = require('fs');
var router = express.Router();

const {
  APP_URL,
  SAML_CERT,
  SAML_PK
} = require("./env-config");

var sp = new saml2.ServiceProvider({
  entity_id: "matt-node-sp",
  private_key: SAML_PK,
  certificate: SAML_CERT,
  auth_context: {
      comparison: "exact",
      class_refs: ["urn:oasis:names:tc:SAML:1.0:am:password"]
  },
  nameid_format: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
  sign_get_request: false,
  allow_unencrypted_assertion: true,
  assert_endpoint: '',
  destination: '',
  force_authn: false,
  context: "Auth0"
});

var idp = new saml2.IdentityProvider({
  sso_login_url: '',
  sso_logout_url: '',
  certificates: [""]
});

router.get('/proxy', function(req, res, next) {
  res.render('samlProxy');
});

router.get('/error', function(req, res, next) {
  res.locals.error = JSON.parse(req.query.error);
  res.render('samlError');
});

router.get('/login', function(req, res, next) {
  res.render('samlLogin');
});

router.get('/login/init', function(req, res, next) {
  sp.create_login_request_url(idp, {}, function(err, login_url, request_id) {
    if (err != null) {
      return res.send(500);
    }
    res.redirect(login_url);
  });
});

router.get('/logout/init', function(req, res, next) {
  sp.create_logout_request_url(idp, {name_id: req.query.name_id}, function(err, logout_url) {
    if (err != null) {
      return res.send(500);
    }
    res.redirect(logout_url);
  });
});

router.get('/logout', function(req, res, next) {
  res.render('samlLogout');
});

router.get('/metadata', function(req, res, next) {
  res.type('application/xml');
  res.status(200).send(sp.create_metadata());
});

router.post('/assert', function(req, res, next) {
  var options = {request_body: req.body};
  sp.post_assert(idp, options, function(err, saml_response) {
    if (err != null) {
      return res.send(500);
    }
    var userDetails = Buffer.from(JSON.stringify(saml_response.user)).toString("base64");
    res.redirect(301, `${APP_URL}/userdetails?user=${userDetails}`);
  });
});

module.exports = router;
