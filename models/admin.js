var schema = require('./base/model')({
    username : { type : String, default : ''},
    password : { type : String, default : ''},
    role     : { type : String, default : ''},
    photo    : { type : String, default : ''},
    created  : { type : Date,   default : Date.now }
});

schema.index({ created: 1 })

module.exports = schema
