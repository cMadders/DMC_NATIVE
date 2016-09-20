var express = require('express');
var router = express.Router();
var async = require('async');
var request = require('request');
var _ = require('underscore');
var AdUnit = require('../models/adunit');
var Creative = require('../models/creative.js');


function handleError(err) {
    console.error(err);
}

router.all("/*", function(req, res, next) {
    if (req.session.dmc_native) {
        // console.log(req.session.dmc_native);
        next();
    } else {
        // console.log('NOT LOGGED-IN AS DMC');
        res.redirect('/auth/login');
    }
});

router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'DMC Native',
        pageID: 'home',
    });
});

router.get('/embed/:shortID', function(req, res, next) {
    res.render('index', {
        title: 'Native Ad Unit Embed Code',
        pageID: 'home',
    });
});


// CREATIVES
router.get('/creatives', function(req, res, next) {
    Creative.find({}, function(err, creatives) {
        res.render('creatives', {
            title: 'Creatives',
            pageID: 'creatives',
            creatives: creatives,
            domain: req.app.locals.domain,
            config: req.app.locals.config
        });
        // res.json(creatives);
    });
});

//REMOVE ORPHAN CREATIVES
router.get('/creatives/remove-orphans', function(req, res, next) {
    var _creatives;
    var _activeCreatives;
    async.waterfall([
        function(callback) {
            // get creatives
            Creative.find({}, { 'id': 1 }, function(err, creatives) {
                if (err) return callback(err);
                _creatives = _.pluck(creatives, 'id');
                callback(null);
            });
        },
        function(callback) {
            // get adunits' creatives
            AdUnit.find({}, { 'creatives': 1 }, function(err, adunits) {
                _activeCreatives = _.pluck(adunits, 'creatives');
                //flatten
                _activeCreatives = _.flatten(_activeCreatives);
                //unique
                _activeCreatives = _.uniq(_activeCreatives);
                callback(null);
            });
        },
    ], function(err, result) {
        if (err) return res.status(500).send(err);
        // remove creatives orphaned creatives
        var toDelete = _.difference(_creatives, _activeCreatives);
        // console.log(toDelete);
        // console.log('toDelete: ' + toDelete.length);
        _.each(toDelete, function(creativeID) {
            Creative.findById(creativeID).remove().exec();
        });
        res.redirect('/dashboard/creatives');
    });
});


// ADUNITS
router.get('/adunits', function(req, res, next) {
    AdUnit.
    find().
    select('name short_id site publisher vertical creatives last_modified extra').
    sort({
        last_modified: -1
    }).
    exec(function(err, adunits) {
        if (err) {
            return res.send(err);
        }

        //determine active creative count
        adunits = _.map(adunits, function(adunit) {
            var count = 0;
            _.each(adunit.creatives, function(creative) {
                if (creative) {
                    count++;
                }
            });
            adunit.creative_count = count;
            return adunit;
        });

        res.render('adunits', {
            title: 'Ad Units',
            pageID: 'adunits',
            adunits: adunits
        });
    });

});

router.get('/adunit/analytics/:shortID', function(req, res, next) {
    // KEEN.IO
    res.render('adunit-analytics', {
        title: req.params.shortID,
        shortID: req.params.shortID,
        pageID: 'adunits',
        domain: req.app.locals.domain,
        config: req.app.locals.config
    });
});


router.get('/analytics/:type?', function(req, res, next) {
    // Mixpanel
    res.render('adunit-analytics-mixpanel', {
        title: req.params.shortID,
        pageID: 'analtyics',
        domain: req.app.locals.domain,
        config: req.app.locals.config
    });
});


router.get('/adunit/:shortID', function(req, res, next) {
    AdUnit.find({
        short_id: req.params.shortID
    }, function(err, adunit) {
        if (err) return handleError(err);
        if (!adunit[0]) {
            return res.render('adunit-not-found', {
                title: req.params.shortID,
                pageID: 'adunits',
                domain: req.app.locals.domain,
                config: req.app.locals.config
            });
        }

        //get creatives associated with adunit
        var creatives = [];
        async.eachSeries(adunit[0].creatives, function(c, callback) {
            // only return associated creatives
            Creative.find({
                _id: c
            }, function(err, creative) {
                if (err) return callback(err);
                if (creative.length) {
                    creatives.push(creative[0]);
                    return callback(null);
                } else {
                    console.log('creative not found');
                    return callback(null);
                }
            });
        }, function(err) {
            if (err) {
                handleError(err);
            } else {
                res.render('adunit-detail', {
                    title: req.params.shortID,
                    pageID: 'adunits',
                    adunit: adunit[0],
                    creatives: creatives,
                    domain: req.app.locals.domain,
                    config: req.app.locals.config
                });
            }
        });
    });
});


router.get('/adunit/edit/:shortID', function(req, res, next) {
    AdUnit.find({
        short_id: req.params.shortID
    }, function(err, adunit) {
        if (err) return handleError(err);
        res.render('adunit-edit', {
            title: req.params.shortID,
            pageID: 'adunits',
            mode: 'edit',
            adunit: adunit[0],
            domain: req.app.locals.domain,
            config: req.app.locals.config
        });
    });
});

// EDIT CREATIVE
router.get('/adunit/:shortID/:creativeID', function(req, res, next) {
    async.waterfall([
        function(callback) {
            AdUnit.find({
                short_id: req.params.shortID,
            }, function(err, adunit) {
                if (err) return callback(null, err);
                callback(null, adunit[0]);
            });
        },
        function(adunit, callback) {
            Creative.find({
                '_id': req.params.creativeID,
            }, function(err, creative) {
                if (err) {
                    return callback(null, {
                        adunit: adunit,
                        error: err
                    });
                }
                callback(null, {
                    adunit: adunit,
                    creative: creative[0]
                });
            });
        }
    ], function(err, result) {
        if (!result.creative) {
            res.render('creative-not-found', {
                title: req.params.shortID,
                pageID: 'adunits',
                adunit: result.adunit,
                creative: null
            });
        }

        var creativesToPersist = result.adunit.creatives_to_persist;
        var index = creativesToPersist.indexOf(result.creative.id);
        res.render('creative-detail', {
            title: req.params.shortID,
            pageID: 'adunits',
            adunit: result.adunit,
            creative: result.creative,
            persistCreative: (index === -1) ? false : true,
            domain: req.app.locals.domain,
            config: req.app.locals.config
        });
    });
});

router.get('/create/adunit/', function(req, res, next) {
    res.render('adunit-create', {
        title: 'Create Ad Unit',
        pageID: 'adunits',
        domain: req.app.locals.domain,
        config: req.app.locals.config
    });
});


module.exports = router;