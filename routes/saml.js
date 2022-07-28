var express = require('express');
var saml2 = require('saml2-js');
var fs = require('fs');
var router = express.Router();
var parseXMLString = require('xml2js').parseStringPromise;
var request = require('request');
var util = require('util');

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

var idp = new saml2.IdentityProvider({
  sso_login_url: `https://mattp-demo.eu.auth0.com/samlp/${CLIENT_ID}`,
  sso_logout_url: `https://mattp-demo.eu.auth0.com/samlp/${CLIENT_ID}/logout`,
  //certificates: [idpMetadata.IDPSSODescriptor.KeyDescriptor.KeyInfo.X509Data.X509Certificate]
  certificates: ["MIIDCTCCAfGgAwIBAgIJFEBa75kobWO3MA0GCSqGSIb3DQEBCwUAMCIxIDAeBgNVBAMTF21hdHRwLWRlbW8uZXUuYXV0aDAuY29tMB4XDTIxMDgxMTEwMjEwNVoXDTM1MDQyMDEwMjEwNVowIjEgMB4GA1UEAxMXbWF0dHAtZGVtby5ldS5hdXRoMC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDYwC4Yg1Es4cyOwLT6WrhLNDb8iibUk2GooQb4tpmHdLT+a90Ge4WMvkyUrS2xxVmIslHnLSBnkDRJ7W0El8E+7aetVdxPInESg/+DXgbmJthAJe76AFMRFC83RPDnosxc96P/3FnaK4ZkKariHOVFkn/OSEAC7a6GKVM/yDya/6KEbv1GlwuRIrcJqyVMeXhfBfmm/dV749qFUcBpD5VbwRZlON30OHRXs/tGOAkfU1u87WMJ8ABtsGw6qK9RuACLJDoOommRu+wjDEbZtTCySsUJUt0ZJHoOMlp6j8Kx89kSodYtbEn09BzcKG6z/mkQhbk4vc40qsZsbSKav+EXAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFKqDIV9LH27bnNV8vOvhLP5rhgDGMA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEABrCCyxrw088hetDCkpbygleJViRcNUmgCSMhvVT/A5Qhei7xFEGtSXycl9NFrA6lBRqq/Vs4MUdIU5RorAEwvLmo2ny8ynAErHXaBLENSvpUTermwWUgbStateYvVFWmUO+vG1BsmJ1RvxVpi7Tos34c/fIxZQs/K3lskbflfeXwjQK0YKKZgsvlO/CeUgiYevFI75JGMjZI4mxZhHIO0lkD9IuMRkj/9KHLoFQ+RadVBQA0hgaQZCF/+WTH2XdLTAncq4jUgpabPBDP2YYpLiO5c5eYYq8k3VB2zrJ9gYCYyB/Zv+boQKFmhSdnIj4ErJEZokYvI5hCkz7TkOD2Qw=="]
});

router.get('/error', function(req, res, next) {
  res.locals.error = JSON.parse(req.query.error);
  res.render('samlError');
});

router.get('/login', function(req, res, next) {
  sp.create_login_request_url(idp, {}, function(err, login_url, request_id) {
    if (err != null) {
      return res.send(500);
    }
    res.redirect(login_url);
  });
});

router.get('/logout', function(req, res, next) {
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

router.post('/assert', function(req, res, next) {
  var options = {request_body: req.body};
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
