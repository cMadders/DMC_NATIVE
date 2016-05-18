var mongoose = require('mongoose');

var DemoSchema = new mongoose.Schema({
    short_id: String, //XY12
    publisher: String,
    links: [],
    enableQR: {
        type: Boolean,
        default: true
    },
    creation_date: {
        type: Date,
        default: Date.now
    },
    created_by: String,
    last_modified: {
        type: Date,
        default: Date.now
    },
    last_modified_by: String
});


DemoSchema.pre('findOneAndUpdate', function() {
    this.update({}, {
        $set: {
            last_modified: new Date(),
        }
    });
});

module.exports = mongoose.model('Demo', DemoSchema);