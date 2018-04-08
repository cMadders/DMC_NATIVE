var mongoose = require('mongoose')
var request = require('request')
var async = require('async')

// Google URL Shortener web service
var getShortURL = function(url, cb) {
  var googleURL =
    'https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyCJJ8LB4xGQtzuguw6vIAhXlylY3MiKung'

  request.post(
    {
      url: googleURL,
      method: 'POST',
      json: { longUrl: url }
    },
    function(err, response, body) {
      if (err) {
        console.error('error', err)
        return cb(null, {
          url: url
        })
      } else {
        // console.log('response', body);
        return cb(null, {
          url: body.id
        })
      }
    }
  )
}

var AdunitSchema = new mongoose.Schema({
  status: String,
  short_id: String, //XY12
  publisher: String,
  site: String,
  vertical: String,
  name: String, //nickname
  headline: String,
  tagline: String,
  slug: String, //{{promoted_by_text}} {{advertiser}}
  thumbnail: String,
  template: String, //html,css,js
  creatives: [],
  creative_count: Number,
  creative_categories: [],
  creatives_to_persist: [],
  creatives_compiled: [],
  // type: String, //IVB or SLP (logic determined by count)
  card: {
    logo: String
    // allow_creative_overrides: Boolean,
    // css: String,
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
    clicks: []
  },
  demo: {
    url: String,
    deviceType: {
      type: String,
      default: 'mobile - iOS'
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
    dmc_index_url_short: String,
    dmc_xul_auto_sync: {
      type: Boolean,
      default: false
    }
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
})

AdunitSchema.pre('findOneAndUpdate', function(next) {
  this.update(
    {},
    {
      $set: {
        last_modified: new Date()
      }
    }
  )

  if (
    this._update['extra.dmc_publication_id'] &&
    this._update['extra.dmc_publication_key']
  ) {
    var i = this._update['extra.dmc_publication_id']
    var k = this._update['extra.dmc_publication_key']
    var v = this._update['vertical']

    var url =
      'https://widgets.digitalmediacommunications.com/widget/embed/index/?p=' +
      i +
      '&k=' +
      k +
      ''

    if (v.toLowerCase() == 'retail') {
      url =
        'https://widgets.digitalmediacommunications.com/retail/embed/index/?p=' +
        i +
        '&k=' +
        k +
        ''
    }

    if (v.toLowerCase() == 'real estate') {
      url =
        'https://widgets.digitalmediacommunications.com/re/embed/index/?p=' +
        i +
        '&k=' +
        k +
        ''
    }

    var self = this
    var updateURL = function(shortUrl) {
      self.update(
        {},
        {
          $set: {
            'extra.dmc_index_url': url,
            'extra.dmc_index_url_short': shortUrl
          }
        }
      )
      next()
    }

    //shorten url
    async.waterfall([async.apply(getShortURL, url)], function(err, result) {
      // console.log('async result');
      updateURL(result.url)
    })
  } else {
    this.update(
      {},
      {
        $set: {
          'extra.dmc_index_url': null,
          'extra.dmc_index_url_short': null
        }
      }
    )
    next()
  }
})

module.exports = mongoose.model('AdUnit', AdunitSchema)
