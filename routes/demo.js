var express = require('express');
var router = express.Router();

router.get('/:name?', function(req, res, next) {
    res.render('demo/shell', {
        title: 'Publihser Demo',
        publication: req.params.name
    });
});

router.get('/card/:name', function(req, res, next) {
    res.render('demo/' + req.params.name, {
        title: 'Publihser Demo'
    });
});

module.exports = router;