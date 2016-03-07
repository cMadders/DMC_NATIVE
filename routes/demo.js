var express = require('express');
var router = express.Router();

router.use(function(req, res, next) {
    // domain you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

router.get('/pjstar', function(req, res, next) {
    res.render('demo/pjstar', {
        title: 'Native Demo'
    });
});

router.get('/denverpost', function(req, res, next) {
    res.render('demo/denverpost', {
        title: 'Native Demo'
    });
});

module.exports = router;