var mongoose = require('mongoose');

var AdunitSchema = new mongoose.Schema({
    status: String,
    short_id: String, //XY12
    publisher: String,
    site: String,
    name: String, //nickname
    headline: String,
    tagline: String,
    slug: String, //{{promoted_by_text}} {{advertiser}}
    thumbnail: String,
    template: String, //html,css,js
    creatives: [],
    creative_count: Number,
    creative_categories: [],
    creatives_compiled: [],
    // type: String, //IVB or SLP (logic determined by count)
    card: {
        allow_creative_overrides: Boolean,
        logo: String,
        css: String,
        // iframe: {
        //     top: Number,
        //     left: Number
        // }
    },
    link: {
        website: String,
        qr: String
    },
    beacons: {
        impression: [],
        visibleImpression: [],
        clicks: [],
    },
    demo: {
        url: String,
        deviceType: {
            type: String,
            default: "mobile - iOS"
        },
        whitelabel: {
            type: Boolean,
            default: false
        }
    },
    extra: {
        dmc_publication_id: String,
        dmc_publication_key: String,
        dmc_index_url: String,
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

AdunitSchema.pre('findOneAndUpdate', function() {
    // console.log(this._update);
    this.update({}, {
        $set: {
            last_modified: new Date(),
        }
    });
    if (this._update['extra.dmc_publication_id'] && this._update['extra.dmc_publication_key']) {
        var i = this._update['extra.dmc_publication_id'];
        var k = this._update['extra.dmc_publication_key'];
        this.update({}, {
            $set: {
                'extra.dmc_index_url': 'http://widgets.digitalmediacommunications.com/widget/embed/index/?p=' + i + '&k=' + k + ''
            }
        });
    } else {
        this.update({}, {
            $set: {
                'extra.dmc_index_url': null
            }
        });
    }
});


module.exports = mongoose.model('AdUnit', AdunitSchema);