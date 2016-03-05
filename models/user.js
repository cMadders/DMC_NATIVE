var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    firstName: String,
    lastName: String,
    active: Boolean,
    roles: [],
    creation_date: {
        type: Date,
        default: Date.now
    },
    last_modified: {
        type: Date,
        default: Date.now
    }
});

UserSchema.pre('save', function(next) {
    now = new Date();
    this.last_modified = now;
    if (!this.creation_date) {
        this.creation_date = now;
    }
    next();
});

module.exports = mongoose.model('User', UserSchema);

