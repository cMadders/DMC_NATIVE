var config = {
    local: {
        domain: 'http://localhost:3000'
    },
    production: {
        domain: 'http://native.digitalmediacommunications.com'
    },
    api: {
        adunit: '/api/adunit',
        creative: '/api/creative',
        publication: '/api/publication',
        sync: '/api/sync/xul/listings',
        removeCreativeFromAdunit: '/api/adunit/remove-creative/',
    }
};

module.exports = config;