var mongoose = require('mongoose');

var DemoItemSchema = new mongoose.Schema({
    url: String, //XY12
    type: {
        type: String,
        default: 'mobile'
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


DemoItemSchema.pre('findOneAndUpdate', function() {
    this.update({}, {
        $set: {
            last_modified: new Date(),
        }
    });
});

module.exports = mongoose.model('DemoItem', DemoItemSchema);