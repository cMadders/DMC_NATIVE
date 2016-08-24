var express = require('express');
var router = express.Router();
var CronJob = require('cron').CronJob;

// https://www.npmjs.com/package/cron

router.get('/sync/listings', function(req, res, next) {
    // try {
    //     new CronJob('0,15,30,45 * * * *', function() {
    //         console.log('this should not be printed');
    //     });
    // } catch (ex) {
    //     console.log("cron pattern not valid");
    // }
    var job = new CronJob('0,15,30,45 * * * *', function() {
        console.log('You will see this message every 15min');
    }, null, true, 'America/New_York');
    res.send('cron: sync listings activated');
});

module.exports = router;