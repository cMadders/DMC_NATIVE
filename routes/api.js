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
    Creative.findOneAndUpdate({
        _id: req.body.creativeID
    }, req.body, function(err, creative) {
        if (err) return handleError(err);
        res.redirect(req.body.returnURL);
    });
});

// CREATE creative and associate it with AdUnit
router.post('/creative', function(req, res, next) {
    if (req.body && req.body.listingID) {
        // var obj = req.body;
        async.waterfall(
            [async.apply(fetchDMCListing, req.body), writeCreative],
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


// DELETE creative
router.delete('/creative/:adunitID/:creativeID', function(req, res, next) {
    // DISABLED FOR NOW

    //TODO: should remove reference to creative from adunit.creative object

    //don't delete, just remove from "active" array
    //association/addition should write to active and assoc collections

    // Creative.findByIdAndRemove(req.params.creativeID, function(err, creative) {
    //     if (err) return handleError(err);
    //     res.send({
    //         status: 'success',
    //         message: 'creative removed',
    //         creative: req.params.creativeID
    //     });
    // });
});


// get creative
// router.get('/dmc-listing/:id?', function(req, res, next) {
//     if (req.params.id === undefined) {
//         res.json({
//             "error": 'specify a listing id'
//         });
//     } else {
//         async.waterfall(
//             [async.apply(fetchDMCListing, {
//                 listingID: req.params.id
//             })],
//             function(err, results) {
//                 res.json(results);
//             });
//     }
// });

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
    // assign short_id
    req.body.created_by = user.username || 'unknown';
    req.body.last_modified_by = user.username || 'unknown';
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

        // reset creatives to []
        // adunit.creatives = [];
        // adunit.save(function(err) {
        //     if (err) {
        //         return console.log(err);
        //     }
        //     res.json(adunit);
        // });

        res.json(adunit);
    });
});

// get compiled adunit (adunit and creative details)
router.get('/adunit/compiled/:id', function(req, res, next) {
    AdUnit.findById(req.params.id, function(err, adunit) {
        if (err) return handleError(err);
        var creatives = [];
        async.eachSeries(adunit.creatives, function(c, callback) {
            // only return associated creatives
            if (c) {
                Creative.find({
                    _id: c._id
                }, function(err, creative) {
                    if (err) return handleError(err);
                    if (creative.length) {
                        creatives.push(creative[0]);
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
    console.log(req.body.template);

    AdUnit.findOneAndUpdate({
        _id: req.body.adunitID
    }, req.body, function(err, creative) {
        if (err) return handleError(err);
        res.redirect(req.body.returnURL);
    });
});


// REMOVE creative from adunit
router.post('/adunit/remove-creative', function(req, res, next) {
    AdUnit.findById(req.body.adunitID, function(err, adunit) {
        if (err) {
            return console.log(err);
        }
        adunit.creatives = _.map(adunit.creatives, function(creative) {
            if (creative && creative._id != req.body.creativeID) {
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

    //Add remove reference to CreativeRemoved document
});

// list adunits
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

// get listing from api.digitalmediacommunications.com
function fetchDMCListing(association, cb) {
    var url = 'http://api.digitalmediacommunications.com:8080/getListingInfo/' + association.listingID;

    request(url, function(err, response, body) {
        if (err) {
            console.error(err);
            return cb(null, {
                "error": err
            });
        } else {
            var obj = JSON.parse(body)[0];
            if (obj === undefined) {
                return cb(null, {
                    "error": 'no listing data found'
                });
            }

            // refine listing object
            var creative = {
                status: "active",
                vertical: obj.publication['vertical'].toLowerCase(),
                advertiser: obj.name,
                name: obj.name,
                headline: obj.name,
                tagline: obj.tagline,
                description: obj.description,
                category: obj.category,
                media: {
                    // thumbnail:obj.thumbnail,
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
                    street: obj.street,
                    city: obj.city,
                    state: obj.state,
                    zip: obj.zip
                },
                extra: {
                    listingID: obj.listingID,
                    dmcAdNumber: obj.dmcAdNumber
                }
            };
            return cb(null, creative, association);
        }
    });
}

// save creative to adunit (within database)
function writeCreative(creative, association, cb) {
    var c = new Creative(creative);
    c.created_by = user.username || 'unknown';
    c.save(function(err, creative) {
        if (err) return handleError(err);
        // console.log('creative saved');
        var AdUnit = require('../models/adunit');
        // console.log('adunitID', association.adunitID);
        //find adunit
        AdUnit.findById(association.adunitID, function(err, adunit) {
            if (err) return handleError(err);
            // associate adunit with creative
            adunit.creatives.push({
                _id: creative._id
            });
            // update/save adunit
            adunit.save(function(err) {
                if (err) return handleError(err);
                return cb(null, {
                    response: 'success',
                    message: 'added',
                    association: association,
                    creative: creative
                });
            });
        });
    });
}

function stripLineBreaks(str){
  return str.replace(/(\r\n|\n|\r)/gm, "");
}

function stripSpacingBetweenTags(str){
    return str.replace(new RegExp( "\>[ ]+\<" , "g" ) , "><" );
}

module.exports = router;