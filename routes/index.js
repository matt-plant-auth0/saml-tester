var express = require('express');
var fetch = require('node-fetch');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  const options = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch('/api/saml-config', options);
  const json = await response.json();
  res.render('index', { title: 'Auth0 SAML Demo', samlSettings: json });
});

module.exports = router;
