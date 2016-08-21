var express = require('express');
var router = express.Router();
var AdUnit = require('../models/adunit');
var UUID = require('uuid');
var escape = require('escape-html');
var Handlebars = require('handlebars');


function handleError(err) {
    console.error(err);
}

router.get('/:adunitID/:index?', function(req, res, next) {
    var index = req.params.index || '0';
    //set random 6 character hash to distinguish ad-unit
    var uuid = "dmc-" + index + '-' + UUID.v4().substr(0, 2);
    // console.log('new adunit', req.params.adunitID, uuid);

    //get user's UUID
    // var user_uuid = getUsersUUID(req.cookies);

    var adunitID = req.params.adunitID;
    var data;


    AdUnit.find({
        short_id: adunitID
    }, function(err, adunit) {
        if (err) return handleError(err);
        if (!adunit[0]) {
            return res.end();
        }

        // HANDLEBARS - bind template with adunit attributes
        var source = adunit[0].template;
        var template = Handlebars.compile(source);
        var adunitData = {
            headline: adunit[0].headline,
            tagline: adunit[0].tagline,
            thumbnail: adunit[0].thumbnail,
            slug: adunit[0].slug,
        };
        var compiledTemplate = template(adunitData);

        data = {
            adunit_id: adunit[0]._id,
            adunit_short_id: req.params.adunitID,
            uuid: uuid,
            // type: null, // type of adunit experience (IVB or SLP)
            template: escape("<div id='" + uuid + "' class='dmc-native' data-adunit='" + adunit[0]._id + "' data-adunit-shortid='" + req.params.adunitID + "'>" + compiledTemplate + "</div>"),
        };
        // console.log(data);

        //declare response header
        res.writeHead(200, {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-cache'
        });

        var embed = "(function(data) { var placeholder = document.currentScript; if (!window.dmc) { window.dmc = { dependenciesLoaded: false, BeaconService: null, DependencyService: null, adunits: [], activate: function(cb) { for (var i = 0; i < window.dmc.adunits.length; i++) { var unit = window.dmc.adunits[i]; if (!unit.activated) { return unit.activate(i, cb) || null; } } } }; } window.dmc.adunits.push({ data: data, activated: false, activate: function(index, cb) { this.activated = true; cb(index, this.data, placeholder); } }); var loadDependencies = function() { var dependencies = ['//cdnjs.cloudflare.com/ajax/libs/jquery/2.2.0/jquery.min.js','//cdnjs.cloudflare.com/ajax/libs/gsap/1.18.2/plugins/CSSPlugin.min.js','//cdnjs.cloudflare.com/ajax/libs/gsap/1.18.2/easing/EasePack.min.js','//cdnjs.cloudflare.com/ajax/libs/gsap/1.18.2/TweenLite.min.js','" + req.app.locals.domain + "/adunit/js/dmc-native.js']; var head = document.head || document.getElementsByTagName('head')[0]; for (var i = 0; i < dependencies.length; i++) { var s = document.createElement('script'); s.async = false; s.type = 'text/javascript'; s.src = dependencies[i]; head.appendChild(s); } }; if (!window.dmc.dependenciesLoaded) { loadDependencies(); } })('" + JSON.stringify(data) + "');";

        res.end(embed);
    });
});


router.get('/template/:adunitID', function(req, res, next) {
    AdUnit.find({
        short_id: req.params.adunitID
    }, function(err, adunit) {
        if (err) return handleError(err);
        res.send(adunit[0].template);
    });
});


// Gets user's UUID. If it exists in memory (cookie), then the value is returned
function getUsersUUID(cookies) {
    // console.log("Cookies: ", req.cookies);
    if (cookies.str_uuid) {
        //refresh with existing UUID
        return cookies.str_uuid;
    } else {
        // Generate a v1 (time-based) id
        return UUID.v1();
    }
}

/*
function safe_tags(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function appendScript(url) {
    return "<script src=\"" + url + "\"></scr' + 'ipt>";
}

function appendStyle(url) {
    return "<link rel=\"stylesheet\" href=\"" + url + "\">";
}
*/

module.exports = router;