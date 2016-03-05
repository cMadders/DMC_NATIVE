var express = require('express');
var router = express.Router();


function requireInternalAccount(req, res, next) {
    if (req.session.dmc_native) {
      // console.log('IS DMC');
      next();
    } else {
        // console.log('NOT LOGGED-IN AS DMC');
        res.redirect('/auth/login');
    }
}

router.get('/', requireInternalAccount, function(req, res, next) {
    // if logged in, redirect to dashboard
    res.redirect('/dashboard');
});

module.exports = router;