var mongoose = require('mongoose');

var CreativeRemoved = new mongoose.Schema({
    creative_id: String,
    adunit_id: String,
    creation_date: {
        type: Date
    },
    created_by: String
});

module.exports = mongoose.model('CreativeRemoved', CreativeRemoved);