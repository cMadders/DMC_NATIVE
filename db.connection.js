var mongoose = require('mongoose'),
    mongooseConnected = false;

var db = {
    connections: {
        mongoose: null,
    },
    connect: function(db, connectionCallback) {
        switch (db) {
            case "mongoose":
                connectMongoose(connectionCallback);
                break;
            default:
                connectMongoose(connectionCallback);
                break;
        }
    },
    dropCollection: function(collectionName) {
        mongoose.connection.collections[collectionName].drop(function(err) {
            console.log('collection dropped: ' + collectionName);
        });
    },
    listCollections: function() {
        console.log('listCollections');
        // console.log(this.connections.mongoose.db);
        // this.connections.mongoose.db.collectionNames(function(err, names) {
        //     console.log(names);
        // });
    }
};


var connectMongoose = function(connectionCallback) {
    if (mongooseConnected) return true;
    // mongoose.connect('mongodb://dmcadmin:native2016@apollo.modulusmongo.net:27017/oru5rYbo');
    mongoose.connect('mongodb://dmcadmin:native2016@olympia.modulusmongo.net:27017/by2Qesig');
    var connection = mongoose.connection;
    db.connections.mongoose = connection;
    connection.on('error', console.error.bind(console, 'connection error:'));
    connection.once('open', function callback() {
        console.log('connection to mongoose successful');
        mongooseConnected = true;
        if (connectionCallback) {
            //execute callback
            connectionCallback();
        }
        // db.listCollections();
        return true;
    });
};

module.exports = db;