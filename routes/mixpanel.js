var express = require('express')
var router = express.Router()

router.get('/test', function(req, res, next) {
  res.render('adunit-analytics-mixpanel', {
    title: 'mixpanel',
    pageID: 'adunits',
    domain: req.app.locals.domain,
    config: req.app.locals.config
  })
})

router.get('/export/:format?', function(req, res, next) {
  var MixpanelExport = require('mixpanel-data-export')
  var panel = new MixpanelExport({
    api_key: '357b7022f986b564e2d75d947961e3f6',
    api_secret: 'c97cbd5d6f444d7ecc12828b7ccd898b'
  })

  var format = req.params.format || 'json'
  format = format.toLowerCase()

  panel
    .events({
      from_date: '2016-08-21',
      to_date: '2016-09-20',
      event: ['IVB Engaged', 'Video Play', 'Share', 'Apply'],
      type: 'general',
      unit: 'day',
      interval: '1',
      format: format
    })
    .then(function(data) {
      if (format == 'json') {
        return res.json(data)
      } else {
        // if format is csv
        res.setHeader('Content-type', 'text/csv')

        // create file and save it to server directory
        var fs = require('fs')
        fs.writeFile('data-export.csv', data, function(err) {
          if (err) throw err
          // console.log('file saved');
          res.download('data-export.csv', 'report-name.csv', function(err) {
            if (err) {
              console.log(err)
            } else {
              console.log('download success')
            }
          })
        })
      }
    })
})
module.exports = router
