var express = require('express');
var router = express.Router();
var request = require('request');

router.use(function(req, res, next) {
    // domain you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    //if logged in
    // if (req.session.dmc_native) {
    //     user = req.session.dmc_native;
    // }

    // only allow API requests for authenticated users
    // if (user_id) next();
    next();
});

function handleError(err) {
    console.error(err);
}

router.get('/list/:adunitID', function(req, res, next) {
    // get adunit definition
    var url = req.app.locals.domain + '/api/adunit/compiled/' + req.params.adunitID;
    request(url, function(error, response, body) {
        if (error) handleError(error);
        if (!error && response.statusCode == 200) {
            // res.json(JSON.parse(body));
            var b = JSON.parse(body);
            delete b.template;
            // remove template from JSON (template may contain script tags that interfere with JSON.Stringify on card list view)
            res.render('card/list', {
                title: 'Card List: ' + req.params.adunitID,
                adunit: b,
                domain: req.app.locals.domain,
                config: req.app.locals.config
            });
        }
    });
});

module.exports = router;