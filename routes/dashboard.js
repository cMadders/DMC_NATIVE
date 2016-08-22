var express = require('express');
var router = express.Router();
var async = require('async');
var request = require('request');
var _ = require('underscore');
var AdUnit = require('../models/adunit');
var Creative = require('../models/creative.js');
var Demos = require('../models/demo.js');

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
        // next();
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

// DEMOS
router.get('/demos', function(req, res, next) {
    Demos.find({}, function(err, demos) {
        res.render('demos', {
            title: 'Demos',
            pageID: 'demos',
            demos: demos,
            domain: req.app.locals.domain,
            config: req.app.locals.config
        });
    });
});


// ADUNITS
router.get('/adunits', function(req, res, next) {
    AdUnit.
    find().
    select('name short_id site publisher vertical creatives last_modified').
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
    // res.render('adunit-analytics', {
    //     title: req.params.shortID,
    //     pageID: 'adunits',
    //     domain: req.app.locals.domain,
    //     config: req.app.locals.config
    // });

    // Mixpanel
    res.render('adunit-analytics-mixpanel', {
        title: req.params.shortID,
        pageID: 'adunits',
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
            if (c && c._id) {
                Creative.find({
                    _id: c._id
                }, function(err, creative) {
                    if (err) return handleError(err);
                    if (creative.length) {
                        creatives.push(creative[0]);
                        return callback();
                    } else {
                        console.log('creative not found');
                        return callback();
                    }
                });
            } else {
                callback();
            }
        }, function(err) {
            if (err) {
                handleError(err);
            } else {
                // console.log('All files have been processed successfully');
                // console.log(creatives);
                // res.json(adunit[0]);
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

        res.render('creative-detail', {
            title: req.params.shortID,
            pageID: 'adunits',
            adunit: result.adunit,
            creative: result.creative,
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



// get demo retail listings
router.get('/retail', function(req, res, next) {
    async.waterfall([
            // get publication listings
            function(callback) {
                listingCollection = [];
                request('http://api.digitalmediacommunications.com:8080/getNativeAdsByPub/1013', function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var listings = JSON.parse(body);
                        callback(null, listings.listings);
                        // callback(null, [{
                        //     listingID: 180743
                        // }, {
                        //     listingID: 178112
                        // }]);
                    }
                });

            },

            // get listing detail (map)
            function(listings, callback) {
                console.log('listing count: ' + listings.length);
                async.eachSeries(listings, fetchListingDetail, function(err) {
                    console.log("Listing Detail EachSeries Finished!");
                    callback(null, listingCollection);
                });
            }
        ],
        function(err, results) {
            console.log('process complete');
            // res.json(listingCollection);

            res.render('creatives-list-preview', {
                title: 'XUL Retail (1013)',
                data: listingCollection,
                pageID: 'xul',
                subpageID: 'retail'
            });
        });
});


// get demo employment listings
router.get('/employment', function(req, res, next) {
    async.waterfall([
            // get publication listings
            function(callback) {
                listingCollection = [];
                request('http://api.digitalmediacommunications.com:8080/getNativeAdsByPub/960', function(error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var listings = JSON.parse(body);
                        callback(null, listings.listings);
                    }
                });

            },

            // get listing detail (map)
            function(listings, callback) {
                console.log('listing count: ' + listings.length);
                async.eachSeries(listings, fetchListingDetail, function(err) {
                    console.log("Listing Detail EachSeries Finished!");
                    callback(null, listingCollection);
                });
            }
        ],
        function(err, results) {
            console.log('process complete');
            // res.json(results);

            res.render('creatives-list-preview', {
                title: 'XUL Employment (960)',
                data: listingCollection,
                pageID: 'xul',
                subpageID: 'employment'
            });
        });
});


var listingCollection = [];

// fetch listing detail
var fetchListingDetail = function(listing, cb) {
    // console.log('listing: ' + listing.listingID);
    request('http://api.digitalmediacommunications.com:8080/getListingInfo/' + listing.listingID, function(err, response, body) {
        if (err) {
            cb(err);
        } else {
            var listing = JSON.parse(body);
            // console.log(listing);
            if (listing[0] && listing[0].name) {
                listingCollection.push(listing[0]);
            }
            cb();
        }
    });
};


module.exports = router;