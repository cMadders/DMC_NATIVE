var express = require('express')
var router = express.Router()
var request = require('request')

router.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
  next()
})

function handleError(err) {
  console.error(err)
  res.status(500).send(err)
}

router.get('/list/:adunitID', function(req, res, next) {
  // get adunit definition
  var url =
    req.app.locals.domain + '/api/adunit/compiled/' + req.params.adunitID
  request(url, function(error, response, body) {
    if (error) handleError(error)
    if (!error && response.statusCode == 200) {
      var adunit = JSON.parse(body)
      delete adunit.template
      // remove template from JSON (template may contain script tags that interfere with JSON.Stringify on card list view)
      res.render('card/list', {
        title: 'Card List: ' + req.params.adunitID,
        adunit,
        domain: req.app.locals.domain,
        config: req.app.locals.config
      })
    }
  })
})

module.exports = router
