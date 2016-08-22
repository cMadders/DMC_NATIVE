var mongoose = require('mongoose');

var CreativeSchema = new mongoose.Schema({
    status: String,
    advertiser: String,
    name: String,
    headline: String,
    tagline: String,
    description: String,
    category: String,
    vertical: String,
    media: {
        logo: String,
        mp4: String
    },
    link: {
        website: String,
        email: String,
        phone: String,
        slp: String,
        slp_short: String,
        qr: String
    },
    address: {
        street: String,
        street_2: String,
        city: String,
        state: String,
        zip: String
    },
    engagement: {
        type: String, //clickout, creative card, custom card
        src: String, //url or iframe src
        target: String, //_blank, _self, card
        card: {
            css: String //override adunit card definitions if allowed
        }
    },
    beacons: {
        impression: [],
        visibleImpression: [],
        clicks: [],
        videoPlays: [],
        shares: {
            facebook: [],
            twitter: [],
            sms: [],
            other: []
        }
    },
    extra: {
        listingID: Number,
        dmcAdNumber: String,
        clixie_vid_uuid: String
    },
    coupon: {
        text: String,
        link: String
    },
    creation_date: {
        type: Date
    },
    created_by: String,
    last_modified: {
        type: Date
    },
    last_modified_by: String
});

CreativeSchema.pre('findOneAndUpdate', function() {
    this.update({}, {
        $set: {
            last_modified: new Date()
        }
    });
});

module.exports = mongoose.model('Creative', CreativeSchema);