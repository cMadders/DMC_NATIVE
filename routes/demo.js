var express = require('express');
var router = express.Router();

router.use(function(req, res, next) {
    // domain you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});


router.get('/card/:name', function(req, res, next) {
    res.render('demo/' + req.params.name, {
        title: 'Native Demo'
    });
});

router.get('/:name', function(req, res, next) {
    res.render('demo/shell', {
        title: 'Native Demo',
        publication: req.params.name
    });
});

module.exports = router;