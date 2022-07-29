var express = require('express');
var saml2 = require('saml2-js');
var fs = require('fs');
var router = express.Router();
var parseXMLString = require('xml2js').parseStringPromise;
var request = require('request');
var util = require('util');

var createdIdp;

var {
  checkUrl,
  APP_URL,
  API_URL,
  ISSUER_BASE_URL,
  CLIENT_ID,
  CLIENT_SECRET,
  SAML_PK,
  SAML_CERT,
  SESSION_SECRET,
  PORT
} = require("../env-config");

var sp = new saml2.ServiceProvider({
  entity_id: "matt-node-sp",
  private_key: SAML_PK,
  certificate: fs.readFileSync("cert.pem").toString(),
  auth_context: {
      comparison: "exact",
      class_refs: ["urn:oasis:names:tc:SAML:1.0:am:password"]
  },
  nameid_format: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
  sign_get_request: false,
  allow_unencrypted_assertion: true,
  assert_endpoint: '/saml/assert',
  force_authn: false,
  context: "Auth0"
});

var idpMetadata = () => {
  return new Promise((resolve, reject) => {
    request.get(`https://mattp-demo.eu.auth0.com/samlp/metadata/${CLIENT_ID}`, async (err, res, body) => {
      if(res.statusCode === 200){
        console.warn(body);
        let parsedMetadata = await parseXMLString(body);
        console.warn(util.inspect(parsedMetadata, false, null));
        resolve(parsedMetadata);
      }else{
        reject(err);
      }
    });
  });
}

let createIdp = async () => {
  let metadata = await idpMetadata();
  if(!createdIdp)
  {
    var idp = new saml2.IdentityProvider({
      sso_login_url: `https://mattp-demo.eu.auth0.com/samlp/${CLIENT_ID}`,
      sso_logout_url: `https://mattp-demo.eu.auth0.com/samlp/${CLIENT_ID}/logout`,
      certificates: metadata.EntityDescriptor.IDPSSODescriptor[0].KeyDescriptor[0].KeyInfo[0].X509Data[0].X509Certificate[0]
    });
    createdIdp = idp;
  }
  return createdIdp;
}

/*var idp = new saml2.IdentityProvider({
  sso_login_url: `https://mattp-demo.eu.auth0.com/samlp/${CLIENT_ID}`,
  sso_logout_url: `https://mattp-demo.eu.auth0.com/samlp/${CLIENT_ID}/logout`,
  certificates: []
});*/

router.get('/error', function(req, res, next) {
  res.locals.error = JSON.parse(req.query.error);
  res.render('samlError');
});

router.get('/login', async function(req, res, next) {
  let idp = await createIdp();
  sp.create_login_request_url(idp, {}, function(err, login_url, request_id) {
    if (err != null) {
      return res.send(500);
    }
    res.redirect(login_url);
  });
});

router.get('/logout', async function(req, res, next) {
  let idp = await createIdp();
  sp.create_logout_request_url(idp, {name_id: req.query.name_id}, function(err, logout_url) {
    if (err != null) {
      return res.send(500);
    }
    res.redirect(logout_url);
  });
});

router.post('/logout', function(req, res, next) {
  res.redirect(301, '/');
});

router.get('/metadata', function(req, res, next) {
  res.type('application/xml');
  res.status(200).send(sp.create_metadata());
});

router.get('/idp-metadata', async function(req, res, next) {
  res.type('application/json');
  let metadata = await idpMetadata();
  res.status(200).send(JSON.stringify(metadata));
});

router.post('/assert', async function(req, res, next) {
  var options = {request_body: req.body};
  let idp = await createIdp();
  sp.post_assert(idp, options, function(err, saml_response) {
    if (err != null) {
      console.error(err);
      return res.sendStatus(500);
    }
    var userDetails = Buffer.from(JSON.stringify(saml_response.user)).toString("base64");
    res.redirect(301, `${APP_URL}/userdetails?user=${userDetails}`);
  });
});

module.exports = router;
