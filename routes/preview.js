var express = require('express');
var router = express.Router();


router.get('/clixie/:uuid?', function(req, res, next) {
    var uuid = req.params.uuid || 'ad3a9d8a-268d-4f0b-94c4-a682ff8b3c28';
    res.render('preview/clixie', {
        title: 'Clixie',
        uuid: uuid
    });
});

router.get('/clixie/embed/:uuid/:mp4', function(req, res, next) {
    res.render('preview/clixie-embed', {
        title: 'Clixie',
        uuid: req.params.uuid,
        mp4: req.params.mp4
    });
});

module.exports = router;