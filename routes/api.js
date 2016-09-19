var express = require('express');
var router = express.Router();
var chalk = require('chalk');
var request = require('request');
var async = require('async');
var _ = require('underscore');
var UUID = require('uuid');
var AdUnit = require('../models/adunit');
var Creative = require('../models/creative.js');

function handleError(err) {
    console.error(err);
    res.status(500).send(err);
}

var user;

router.use(function(req, res, next) {
    // domain you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    //if logged in
    if (req.session.dmc_native) {
        user = req.session.dmc_native;
    }

    // only allow API requests for authenticated users
    // if (user_id) next();
    next();
});

function handleError(err) {
    console.error(err);
}

function getNativeListings(adunitID, cb) {
    AdUnit.findById(adunitID, { 'creatives_to_persist': 1, 'creatives': 1 }, function(err, adunit) {
        if (err) return cb(err);
        cb(null, adunit);
    });
}


router.post('/sync/xul/listings', function(req, res, next) {
    var adunitID = req.body.adunitID;
    // console.log('adunitID: ' + adunitID);
    var _creativesToPersist = [];
    async.waterfall([
        function(cb) {
            AdUnit.findById(adunitID, { 'creatives_to_persist': 1, 'creatives': 1, 'extra.dmc_publication_id': 1 }, function(err, adunit) {
                if (err) return cb(err);
                if (!adunit) return cb({ message: 'no ad unit returned' });
                _creativesToPersist = adunit.creatives_to_persist;
                cb(null, adunit.extra.dmc_publication_id);
            });
        },
        // GET XUL LISTINGS
        function(publicationID, cb) {
            fetchDMCPublication({ adunitID: adunitID, publicationID: publicationID }, cb);
        },
        // PROCESS
        function(response, cb) {
            var xulCreatives = response.xulCreatives;
            xulCreatives = _.difference(xulCreatives, ['', null, undefined]);
            // add persistent creatives if they're not already in the mix
            _.each(xulCreatives, function(creative) {
                var index = _creativesToPersist.indexOf(creative);
                if (index === -1) {
                    _creativesToPersist.push(creative);
                }
            });
            AdUnit.findById(adunitID, function(err, adunit) {
                if (err) return cb(err);
                adunit.creatives = _creativesToPersist;
                adunit.save();
                cb(null, adunit.creatives);
            });
        }
    ], function(err, result) {
        if (err) {
            // console.log(err);
            return res.json({
                "response": 'error',
                "message": err.message,
                "count": 0
            });
        }
        res.json({ message: 'Sync Successful', count: 'Creatives Synced: ' + result.length });
    });
});


router.get('/sync/xul/listings/:adunitID', function(req, res, next) {
    var adunitID = req.params.adunitID;
    var _creativesToPersist = [];

    async.waterfall([
        function(cb) {
            AdUnit.findById(adunitID, { 'creatives_to_persist': 1, 'creatives': 1, 'extra.dmc_publication_id': 1 }, function(err, adunit) {
                if (err) return cb(err);
                if (!adunit) return cb({ message: 'no ad unit returned' });
                _creativesToPersist = adunit.creatives_to_persist;
                cb(null, adunit.extra.dmc_publication_id);
            });
        },

        // GET XUL LISTINGS
        function(publicationID, cb) {
            fetchDMCPublication({ adunitID: adunitID, publicationID: publicationID }, cb);
        },

        // PROCESS
        function(response, cb) {
            var xulCreatives = response.xulCreatives;
            xulCreatives = _.difference(xulCreatives, ['', null, undefined]);
            // console.log('xulCreatives: ' + xulCreatives);
            // console.log('_creativesToPersist: ' + _creativesToPersist);

            // add persistent creatives if they're not already in the mix
            _.each(xulCreatives, function(creative) {
                var index = _creativesToPersist.indexOf(creative);
                if (index === -1) {
                    _creativesToPersist.push(creative);
                }
            });
            AdUnit.findById(adunitID, function(err, adunit) {
                if (err) return cb(err);
                adunit.creatives = _creativesToPersist;
                adunit.save();
                cb(null, adunit.creatives);
            });
        }
    ], function(err, result) {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

router.get('/ga/event/:eventName?', function(req, res, next) {
    // https://www.npmjs.com/package/universal-analytics
    var reqUrl = req.protocol + '://' + req.hostname + req.originalUrl;
    var eventName = req.params.eventName || 'general';
    var ua = require('universal-analytics');
    var visitor = ua('UA-77904027-3');
    visitor.pageview("/", eventName, reqUrl, function(err) {
        if (err) {
            console.log('ga error: ', ga);
        } else {
            console.log('ga success');
            res.send(reqUrl);
        }
    });
});


router.get('/mixpanel/export/:format?', function(req, res, next) {
    var MixpanelExport = require('mixpanel-data-export');
    var panel = new MixpanelExport({
        api_key: "357b7022f986b564e2d75d947961e3f6",
        api_secret: "c97cbd5d6f444d7ecc12828b7ccd898b"
    });

    var format = req.params.format || 'json';
    format = format.toLowerCase();

    panel.events({
        from_date: "2016-08-15",
        to_date: "2016-09-17",
        event: ["IVB Engaged", "Video Play", "Share", "Apply"],
        type: "general",
        unit: "day",
        interval: "1",
        format: format
    }).then(function(data) {
        if (format == 'json') {
            return res.json(data);
        } else {
            // if format is csv
            res.setHeader('Content-type', 'text/csv');

            // create file and save it to server directory
            var fs = require('fs');
            fs.writeFile('data-export.csv', data, function(err) {
                if (err) throw err;
                // console.log('file saved');
                res.download('data-export.csv', 'report-name.csv', function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('download success');
                    }
                });
            });
        }
    });
});

// get publication listings and write associated creatives to database
router.post('/publication', function(req, res, next) {
    if (req.body && req.body.publicationID) {
        async.waterfall(
            [async.apply(fetchDMCPublication, req.body)],
            function(err, result) {
                res.json(result);
            });
    } else {
        res.json({
            "response": 'error',
            "message": 'listingID required in post request'
        });
    }
});


// get listing from api.digitalmediacommunications.com
function fetchDMCPublication(req, cb) {
    var url = 'http://api.digitalmediacommunications.com:8080/getNativeAdsByPub/' + req.publicationID;
    request(url, function(err, response, body) {
        if (err) {
            return cb({
                response: 'error',
                message: err
            });
        } else {
            // console.log(body.listings);
            var b = JSON.parse(body);
            // console.log(b);
            if (!b.listings || b.listings.length === 0) {
                // console.log('XUL Publication Is Not Native Enabled');
                return cb({
                    response: 'error',
                    message: 'XUL Publication Is Not Native Enabled or Listing Count = 0'
                });
            }

            var cArry = [];
            // loop through each associated listing
            async.eachSeries(b.listings, function(listing, cb) {
                req.listingID = listing.listingID;

                // fetch and write to database
                // console.log('fetch and write');
                async.waterfall(
                    [async.apply(fetchDMCListing, req, "listingID"), writeCreative],
                    function(err, result) {
                        if (err) return cb(err);
                        // console.log('result');
                        // console.log(result.creative.id);
                        cArry.push(result.creative.id);
                        cb(null);
                    });
            }, function(err) {
                if(err){
                    return cb(err);
                }
                cb(null, {
                    response: 'success',
                    message: 'Publication Listings Synced',
                    req: req,
                    xulListings: b.listings,
                    xulCreatives: cArry
                });
            });
        }
    });
}


// GET creative
router.get('/creative/:id', function(req, res, next) {
    Creative.findById(req.params.id, function(err, data) {
        if (err) return handleError(err);
        res.json(data);
    });
});



// UPDATE creative
router.post('/creative/update', function(req, res, next) {
    req.body.last_modified_by = user.username || 'unknown';
    var persistCreative = (req.body.persistCreative === undefined) ? false : true;
    req.body['extra.protect_overwrite'] = (req.body['extra.protect_overwrite'] === undefined) ? false : true;
    async.waterfall([
        // update ad unit
        function(callback) {
            AdUnit.findById(req.body.adunitID, function(err, adunit) {
                if (err) return callback(err);
                // console.log('adunit found: ' + adunit.id);
                // console.log('creatives_to_persist: ' + adunit.creatives_to_persist);
                var index = _.indexOf(adunit.creatives_to_persist, req.body.creativeID);
                if (index === -1) {
                    // console.log('not found');
                    if (persistCreative) {
                        // add to array
                        adunit.creatives_to_persist.push(req.body.creativeID);
                        adunit.save();
                    }
                } else {
                    if (!persistCreative) {
                        //remove from array
                        adunit.creatives_to_persist.splice(index, 1);
                        adunit.save();
                    }
                }
                callback(null, adunit);
            });
        },
        function(data, callback) {
            // update creative
            Creative.findOneAndUpdate({
                _id: req.body.creativeID
            }, req.body, function(err, creative) {
                if (err) return callback(err);
                callback(null);
            });
        }
    ], function(err, result) {
        if (err) return res.status(500).send(err);
        // res.status(200).send('processed successfully using async lib');
        console.log('waterfall complete');
        console.log('persistCreative: ' + persistCreative);
        res.redirect(req.body.returnURL);
    });
});

// CREATE creative and associate it with AdUnit
router.post('/creative', function(req, res, next) {
    if (req.body && req.body.listingID) {
        // var obj = req.body;
        async.waterfall(
            [async.apply(fetchDMCListing, req.body, "dmcAdNumber"), writeCreative],
            function(err, result) {
                // console.log('waterfall complete');
                res.json(result);
            });
    } else {
        res.json({
            "response": 'error',
            "message": 'listingID required in post request'
        });
    }
});


//get removed creative references
router.get('/creatives-removed/:adunitID', function(req, res, next) {
    var CreativeRemoved = require('../models/creativeRemoved.js');
    CreativeRemoved.find({ adunit_id: req.params.adunitID }, function(err, adunit) {
        if (err) return handleError(err);
        res.json(adunit);
    });
});


//CREATE adunit
router.post('/adunit/create', function(req, res, next) {
    req.body.created_by = user.username || 'unknown';
    req.body.last_modified_by = user.username || 'unknown';
    // assign short_id (ensure uniqueness?)
    req.body.short_id = UUID.v4().substr(0, 4);
    var a = new AdUnit(req.body);
    a.save(function(err, adunit) {
        if (err) {
            res.json(err);
        }
        res.redirect('/dashboard/adunit/' + req.body.short_id);
    });
});


//get adunit
router.get('/adunit/:id', function(req, res, next) {
    AdUnit.findById(req.params.id, function(err, adunit) {
        if (err) return handleError(err);
        res.json(adunit);
    });
});

// get compiled adunit (adunit and creative details)
router.get('/adunit/compiled/:id', function(req, res, next) {
    var cache = require('memory-cache');
    var adunitID = req.params.id;

    // return cached version if exists
    if (cache.get(adunitID)) {
        // console.log('return cached version: ', adunitID);
        return res.status(200).json(cache.get(adunitID));
    }

    AdUnit.findById(adunitID, function(err, adunit) {
        if (err) return handleError(err);
        var creatives = [];
        async.eachSeries(adunit.creatives, function(c, callback) {
            // only return associated creatives
            if (c) {
                Creative.find({
                    _id: c
                }, function(err, creative) {
                    if (err) callback(err);
                    if (creative.length) {
                        creatives.push(creative[0]);
                        callback(null);
                    }
                });
            } else {
                return callback('no creative found');
            }
        }, function(err) {
            if (err) {
                handleError(err);
            } else {
                adunit.creative_count = creatives.length;
                adunit.creatives_compiled = creatives;
                // populate categories
                adunit.creative_categories = [];
                _.each(adunit.creatives_compiled, function(creative) {
                    adunit.creative_categories.push(creative.category);
                });
                //unique cateogories
                adunit.creative_categories = _.uniq(adunit.creative_categories);
                // sort categories
                adunit.creative_categories = _.sortBy(adunit.creative_categories);
                // number of videos per category?
                var categoryCount = [];
                _.each(adunit.creative_categories, function(category) {
                    var count = 0;
                    _.each(adunit.creatives_compiled, function(creative) {
                        if (creative.category == category) {
                            count++;
                        }
                    });
                    categoryCount.push({
                        category: category,
                        count: count
                    });
                });
                adunit.creative_categories = categoryCount;

                // store response in cache
                cache.put(adunitID, adunit, 50000, function(key, value) {
                    // Time in ms (5 minutes)
                });

                res.json(adunit);
            }
        });
    });
});

//DELETE adunit
router.delete('/adunit/:id', function(req, res, next) {
    AdUnit.findByIdAndRemove(req.params.id, function(err, adunit) {
        if (err) return handleError(err);
        res.send({
            status: 'success',
            message: 'removed'
        });
    });
});

// UPDATE adunit
router.post('/adunit/update', function(req, res, next) {
    req.body.last_modified_by = user.username || 'unknown';
    // strip spaces and line breaks from template
    req.body.template = stripLineBreaks(req.body.template);
    req.body.template = stripSpacingBetweenTags(req.body.template);

    req.body['extra.dmc_xul_auto_sync'] = (req.body['extra.dmc_xul_auto_sync'] === undefined) ? false : true;

    if (!req.body['extra.dmc_publication_id'] || !req.body['extra.dmc_publication_key']) {
        // remove publication association if both key and id are not set
        req.body['extra.dmc_publication_id'] = null;
        req.body['extra.dmc_publication_key'] = null;
        req.body['extra.dmc_xul_auto_sync'] = false;
    }

    AdUnit.findOneAndUpdate({
        _id: req.body.adunitID
    }, req.body, function(err, creative) {
        if (err) return handleError(err);
        res.redirect(req.body.returnURL);
    });
});


// REMOVE creative association from adunit
router.post('/adunit/remove-creative', function(req, res, next) {
    AdUnit.findById(req.body.adunitID, function(err, adunit) {
        if (err) {
            return console.log(err);
        }
        adunit.creatives = _.filter(adunit.creatives, function(creative) {
            if (creative != req.body.creativeID.toString()) {
                return creative;
            }
        });
        adunit.save(function(err) {
            if (err) {
                return console.log(err);
            }
            res.json(adunit);
        });
    });
});


// LIST AD UNITS
router.get('/adunits/', function(req, res, next) {
    AdUnit.
    find().
    sort({
        last_modified: -1
    }).
    exec(function(err, units) {
        if (err) {
            return res.send(err);
        }
        res.json({
            adunits: units,
        });
    });
});

// FETCH DMC LISTING
// get listing from api.digitalmediacommunications.com
function fetchDMCListing(req, type, cb) {
    // console.log('fetchDMCListing', req.listingID);
    // console.log('type', type);
    var url = 'http://api.digitalmediacommunications.com:8080/getListingInfoByAdnumber/' + req.listingID;
    if (type === "listingID") {
        url = 'http://api.digitalmediacommunications.com:8080/getListingInfo/' + req.listingID;
    }

    request(url, function(err, response, body) {
        if (err) {
            return cb(null, {
                response: 'error',
                message: err
            });
        } else {
            if (body.length == 2) {
                console.log('XUL listing not found: ' + req.listingID + ' | type: ' + type);
                return cb(null, {
                    response: 'error',
                    message: 'no listing data found'
                }, req);
                // return cb({
                //     response: 'error',
                //     message: 'no listing data found'
                // });
            }
            var obj = JSON.parse(body)[0];
            if (obj === undefined) {
                return cb(null, {
                    response: 'error',
                    message: 'no listing data found'
                }, req);
                // return cb({
                //     response: 'error',
                //     message: 'no listing data found'
                // });
            }

            // refine listing object
            var creative = createCreativeObject(obj);
            // console.log('creative', creative);
            return cb(null, creative, req);
        }
    });
}

// WRITE CREATIVE
// save creative to adunit
function writeCreative(creative, req, cb) {
    if (creative.response === "error") {
        return cb(null, {
            response: 'error',
            message: 'no listing data found',
            req: req,
            creative: creative
        });
    }

    var listingID = creative.extra.listingID;
    // if creative exists - update, else - save
    Creative.findOne({ 'extra.listingID': listingID }, function(err, existingCreative) {
        if (err) {
            // console.log('error with creative lookup');
            return cb(err);
        } else {
            if (existingCreative) {
                // UPDATE

                //update creative information if not protected
                if (!existingCreative.extra.protect_overwrite) {
                    updateCreative(existingCreative, creative);
                }

                //associate with adunit
                AdUnit.findOne({ '_id': req.adunitID }, function(err, adunit) {
                    if (err) return cb(err);
                    if (adunit && adunit.creatives) {
                        // determine if creative exists
                        var exists = _.findWhere(adunit.creatives, { 'listingID': existingCreative.extra.listingID });
                        if (exists) {
                            // console.log('adunit match found');
                            return cb(null, {
                                response: 'success',
                                message: 'creative and association already exist',
                                req: req,
                                creative: existingCreative
                            });
                        } else {
                            // no match found
                            AdUnit.findById(req.adunitID, function(err, adunit) {
                                if (err) return cb(err);
                                // associate adunit with creative
                                adunit.creatives.push({
                                    _id: existingCreative._id,
                                    listingID: existingCreative.extra.listingID
                                });
                                // update/save adunit
                                adunit.save(function(err) {
                                    if (err) return cb(err);
                                    // console.log('creative associated with ad unit: ', req.adunitID);
                                    return cb(null, {
                                        response: 'success',
                                        message: 'creative exists - association with ad unit now complete',
                                        req: req,
                                        creative: existingCreative
                                    });
                                });
                            });
                        }
                    } else {
                        return cb('no ad unit found');
                    }
                });
            } else {
                // CREATE NEW (ADD)
                // console.log('create new creative: ', listingID);
                var c = new Creative(creative);
                c.created_by = user.username || 'unknown';
                c.save(function(err, creative) {
                    if (err) return cb(err);
                    // console.log('creative added');
                    //associate with adunit
                    AdUnit.findById(req.adunitID, function(err, adunit) {
                        if (err) return cb(err);
                        // associate adunit with creative
                        adunit.creatives.push({
                            _id: creative._id,
                            listingID: creative.extra.listingID
                        });
                        // update/save adunit
                        adunit.save(function(err) {
                            if (err) return cb(err);
                            // console.log('creative associated with ad unit: ', req.adunitID);
                            return cb(null, {
                                response: 'success',
                                message: 'added',
                                req: req,
                                creative: creative
                            });
                        });
                    });
                });
            }
        }
    });
}

// update creative properties (from XUL)
function updateCreative(existingCreative, newCreative) {
    Creative.findByIdAndUpdate(existingCreative.id, { $set: newCreative }, { new: true }, function(err, Event) {
        if (err) console.log(err);
        // console.log('updated creative');
    });
}

function createCreativeObject(obj) {
    var creative = {
        status: "active",
        vertical: obj.publication['vertical'],
        advertiser: obj.name,
        name: obj.name,
        headline: obj.name,
        tagline: obj.tagline,
        description: obj.description,
        category: obj.category,
        media: {
            logo: obj.media.logoGif,
            mp4: obj.media.mp4
        },
        link: {
            website: obj.website,
            email: obj.email,
            phone: obj.phone,
            slp: obj.links.slpLink,
            slp_short: obj.links.shortLink,
            qr: obj.links.qrLink
        },
        address: {
            street: obj.address_1,
            street_2: obj.address_2,
            city: obj.city,
            state: obj.state,
            zip: obj.zip
        },
        coupon: {
            text: obj.media.couponText,
            link: obj.couponLink
        },
        extra: {
            listingID: obj.listingID,
            dmcAdNumber: obj.dmcAdNumber,
            clixie_vid_uuid: obj.clixie_vid_uuid
        }
    };
    return creative;
}

function stripLineBreaks(str) {
    return str.replace(/(\r\n|\n|\r)/gm, "");
}

function stripSpacingBetweenTags(str) {
    return str.replace(new RegExp("\>[ ]+\<", "g"), "><");
}

module.exports = router;