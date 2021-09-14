var express = require('express');
var saml2 = require('saml2-js');
var fs = require('fs');
var router = express.Router();

var apiKey = "3_NGgdmfwzc5vxdnp6r3MCOzj-38fldXK-XUN09TWf-p0LQIkZbm-sfu1lNz4yQkJd";

var sp = new saml2.ServiceProvider({
  entity_id: "matt-node-sp",
  private_key: fs.readFileSync("./Federation/key.pem").toString(),
  certificate: fs.readFileSync("./Federation/cert.pem").toString(),
  auth_context: {
      comparison: "exact",
      class_refs: ["urn:oasis:names:tc:SAML:1.0:am:password"]
  },
  nameid_format: "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent",
  sign_get_request: false,
  allow_unencrypted_assertion: true,
  assert_endpoint: `https://fidm.eu1.gigya.com/saml/v2.0/${apiKey}/sp/acs`,
  destination: `https://fidm.eu1.gigya.com/saml/v2.0/${apiKey}/idp/sso`,
  force_authn: false,
  context: "CDC"
});

var idp = new saml2.IdentityProvider({
  sso_login_url: `https://fidm.eu1.gigya.com/saml/v2.0/${apiKey}/idp/sso`,
  sso_logout_url: `https://fidm.eu1.gigya.com/saml/v2.0/${apiKey}/idp/slo`,
  certificates: ["MIICvDCCAaSgAwIBAgIQLCcS+E352I5BmpM4p+81jzANBgkqhkiG9w0BAQUFADAZMRcwFQYDVQQDEw5HaWd5YSBTQU1MIElkUDAgFw0xOTA5MTEwODQyNDZaGA8yMTE5MDkxMTA4NDI0NlowGTEXMBUGA1UEAxMOR2lneWEgU0FNTCBJZFAwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDYJkHYnHn4k8PLR9TZZfI3ka+Cb6NRR9eTJMT+bAi349DIKwVwCBaSvweK5R5DYHFaQBQ1G27S+xVMHHaym26IJy3W4leFlFYK9B9JyFUNEiu9y/8rBBSKSWYXB82ZZfCBKZE1PQxpS1eQtD2A4pCvsl4nBrMMCWJ4z2Vgp+Avb0/B1JqG4uhR/RCsmT87ZSOeTiUaj4bNWJrtJAfkJTwF54aA/3M36iy9vfBc76Jlf5cXp0CjJqtS87YzNBm0BWB3ebL3MbwwVbwMHdMP4uK8ZHGPhUa/wYDFnR63WzXfRkR9fE/Ov3YsaeUjHSgni7b6Lhvg167kFxpkUgF7NjSVAgMBAAEwDQYJKoZIhvcNAQEFBQADggEBAJzIbEfQKHWDcelC+uKdqpRp7NYpINSERubUl8scegn9+oQ7C30VcnH0+2b9xCkS3WzmncBMIJQQ1zBw6m0L+khBosc/8oKfBtrQbi5puzIjjeXW/yuk9+hOYbVSdUq7CZhlEmw9NhBy0AZl1iCM8GEwK3VDZndzwhHO/wlhoQdCE3kwU9COZe1Ay+1DteEWwS8KayyBANSGtLAgF2WVb9EShU1vPISZXs5Q64YPUkfmIe3csX+rYWSVuyC8EDC1C1+DYRyfKo8Q7kHCg7u4lz+v9NB3YtJ/hMjlxjrOOXXgk7BQ7YWWTgcJmuEhhOygUxGJab50rhKO2uWGfKMj6Uw="]
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
    res.redirect(301, `http://localhost:3000/userdetails?user=${userDetails}`);
  });
});

module.exports = router;
