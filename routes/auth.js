var express = require('express');
var router = express.Router();
var User = require('../models/user.js');

function handleError(err) {
    console.error(err);
}

router.get('/', function(req, res, next) {
    res.redirect('/auth/login');
});


router.get('/logout', function(req, res, next) {
    // destroy session
    req.session = null;
    res.redirect('/');
});


router.get('/login/:failed?', function(req, res, next) {
    res.render('auth', {
        title: 'DMC',
        username: 'jcottam',
        pw: '*******',
        failed: req.params.failed
    });
});

router.post('/login', function(req, res) {
    User.find({
        username: req.body.username,
        password: req.body.password
    }, function(err, user) {
        if (err) return handleError(err);
        if (user.length) {
            // console.log('login success');
            // console.log(user);
            // if (user[0].password === "dmc") {
            //     res.redirect('/auth/change-pw/' + user[0].username);
            // } else {
                // console.log(user);
                //serialize user
                //write cookie to user
                req.session.dmc_native = user[0];
                res.redirect('/dashboard/adunits');
            // }
        } else {
            res.redirect('/auth/login/failed');
        }
    });
});

// request pw change
router.get('/change-pw/:username', function(req, res, next) {
    res.render('change-pw', {
        title: 'DMC',
        username: req.params.username
    });
});

// update pw
router.post('/change-pw', function(req, res, next) {
    User.find({
        username: req.body.username,
    }, function(err, user) {
        if (err) return handleError(err);
        if (user.length) {
            console.log('user found');
            console.log('update pw');
            console.log(req.body.password);
        }
    });
});


module.exports = router;