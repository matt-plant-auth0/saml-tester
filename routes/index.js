var express = require('express');
var crypto = require('crypto');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const rawConfig = await fetch('/api/saml-config', options);
  const jsonConfig = await res.json();
  res.render('index', { title: 'Auth0 SAML Demo', samlSettings: jsonConfig });
});

module.exports = router;
