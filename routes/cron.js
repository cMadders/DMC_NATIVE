var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');
var _ = require('underscore');
var AdUnit = require('../models/adunit');
var Creative = require('../models/creative.js');
var CronJob = require('cron').CronJob;

// https://www.npmjs.com/package/cron
router.get('/trigger', function(req, res, next) {
    var job = new CronJob('*/20 * * * *', function() {
        console.log('You will see this message every 20min');
        syncListings(req);
    }, null, true, 'America/New_York');
    console.log('cron: sync listings activated');
    res.redirect('/');
});

router.get('/sync/listings', function(req, res, next) {
    syncListings(req);
    res.redirect('/dashboard/adunits');
});

function syncListings(req) {
    var _adunits;
    var _result = [];

    async.waterfall([
        function(cb) {
            // get adunits
            AdUnit.find({ 'extra.dmc_xul_auto_sync': true }, { 'id': 1, 'publisher': 1, 'name': 1 }, function(err, adunits) {
                if (err) return cb(err);
                // console.log(adunits);
                cb(null, adunits);
            });
        },
        function(adunits, cb) {
            //async each
            async.eachSeries(adunits, function(adunit, callback) {
                var obj = {};
                obj.adunit = adunit.id;
                obj.publisher = adunit.publisher;
                obj.name = adunit.name;
                // console.log('\n-----------');
                // console.log('Processing file ' + adunit.id);
                request.post(req.app.locals.domain + '/api/sync/xul/listings', { form: { 'adunitID': adunit.id } }, function(err, response, body) {
                    if (err) return callback(err);
                    console.log(body);
                    obj.status = JSON.parse(body);
                    _result.push(obj);
                    callback();
                });
            }, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    // console.log('All files have been processed successfully');
                    cb();
                }
            });
        },
    ], function(err, result) {
        if (err) return res.status(500).send(err);
         // on success, clear cached responses.
        // console.log('XUL Auto-SYNC Complete');
        // res.status(200).send('XUL Auto-SYNC Complete');
        // res.json(_result);
    });
}

module.exports = router;