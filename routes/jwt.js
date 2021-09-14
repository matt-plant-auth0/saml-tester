var express = require('express');
var request = require('request');
var jws = require('jws-lite');
var router = express.Router();

router.get('/:apiKey/:token', async function(req, res, next) {
  var jwk = await getJWTPublicKey(req.params.apiKey);
  try{
    var payload = await jws.verify(req.params.token, JSON.parse(jwk));
    var payloadObj = JSON.parse(payload);
    res.render('jwt', {
      iss: "iss: " + payloadObj.iss, 
      apiKey: "apiKey: " + payloadObj.apiKey, 
      iat: "iat: " + payloadObj.iat,
      exp: "exp: " + payloadObj.exp,
      sub: "sub: " + payloadObj.sub
    });
  }catch(e){
    res.render('jwt', {payload: "Error: " + e.toString()});
  }
});

router.post('/:apiKey/:token', async function(req, res, next) {
  var jwk = await getJWTPublicKey(req.params.apiKey);
  try{
    var payload = await jws.verify(req.params.token, JSON.parse(jwk));
    var payloadObj = JSON.parse(payload);
    res.type('application/json');
    res.send(payloadObj);
  }catch(e){
    res.status(400).send("Error: " + e.toString());
  }
});

function getJWTPublicKey(apiKey){
  return new Promise(resolve => {
    //in a prod scenario, this should be cached and only refreshed if the validation fails first time
    request.get("https://accounts.eu1.gigya.com/accounts.getJWTPublicKey?apiKey=" + apiKey, (err, res, body) => {
      if(res.statusCode === 200){
        resolve(body);
      }else{
        resolve(err);
      }
    });
  });
}

module.exports = router;
