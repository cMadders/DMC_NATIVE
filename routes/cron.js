var express = require('express');
var router = express.Router();
var request = require('request');
var async = require('async');
var _ = require('underscore');
var AdUnit = require('../models/adunit');
var Creative = require('../models/creative.js');
var CronJob = require('cron').CronJob;

// https://www.npmjs.com/package/cron

router.get('/sync/listings', function(req, res, next) {
    var _adunits;

    async.waterfall([
        function(cb) {
            // get adunits
            AdUnit.find({}, { 'id': 1 }, function(err, adunits) {
                if (err) return cb(err);
                _adunits = _.pluck(adunits, 'id');
                cb(null, _adunits);
            });
        },
        function(adunits, cb) {
            // console.log(adunits[0]);

            // request.post('http://localhost:3000/api/sync/xul/listings', { form: { 'adunitID': adunits[1] } }, function(err, response, body) {
            //     if (err) return callback(err);
            //     console.log('\n-----------');
            //     console.log(body);
            //     cb();
            // });

            //async each
            async.eachSeries(adunits, function(adunitID, callback) {
                // Perform operation on file here.
                console.log('Processing file ' + adunitID);
                request.post('http://localhost:3000/api/sync/xul/listings', { form: { 'adunitID': adunitID } }, function(err, response, body) {
                    if (err) return callback(err);
                    console.log('\n-----------');
                    console.log(body);
                    callback();
                });
            }, function(err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('All files have been processed successfully');
                    cb();
                }
            });
        },
    ], function(err, result) {
        if (err) return res.status(500).send(err);
        res.status(200).send('success');
    });


    // try {
    //     new CronJob('0,15,30,45 * * * *', function() {
    //         console.log('this should not be printed');
    //     });
    // } catch (ex) {
    //     console.log("cron pattern not valid");
    // }

    // var job = new CronJob('0,15,30,45 * * * *', function() {
    //     console.log('You will see this message every 15min');
    // }, null, true, 'America/New_York');
    // res.send('cron: sync listings activated');


    // on success, clear cached responses.

});

module.exports = router;