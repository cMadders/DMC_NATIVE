var mongoose = require('mongoose'),
  mongooseConnected = false

var db = {
  connections: {
    mongoose: null
  },
  connect: function(db, connectionCallback) {
    switch (db) {
      case 'mongoose':
        connectMongoose(connectionCallback)
        break
      default:
        connectMongoose(connectionCallback)
        break
    }
  }
}

var connectMongoose = function(connectionCallback) {
  if (mongooseConnected) return true
  mongoose.connect(process.env.MONGO_URI)

  var connection = mongoose.connection
  db.connections.mongoose = connection
  connection.on('error', console.error.bind(console, 'connection error:'))
  connection.once('open', function callback() {
    console.log('connection to mongoose successful')
    mongooseConnected = true
    if (connectionCallback) {
      connectionCallback()
    }
    return true
  })
}

module.exports = db
