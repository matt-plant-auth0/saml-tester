var express = require('express');
var os = require('os');
var router = express.Router();

router.get('/', function(req, res, next) {
  var samlUser = JSON.parse(Buffer.from(req.query.user, 'base64').toString());
  var displayObj = {title: "SAML User Details", name_id: samlUser.name_id, attributes: ''};
  for(var prop in samlUser.attributes){
    displayObj.attributes += `${prop}: ${samlUser.attributes[prop]}${os.EOL}`;
  }
  res.render('userDetails', displayObj);
});

module.exports = router;
