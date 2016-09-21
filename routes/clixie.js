var express = require('express');
var router = express.Router();


router.get('/embed', function(req, res, next) {
    res.render('preview/clixie-embed', {
        title: 'Clixie'
    });
});

module.exports = router;