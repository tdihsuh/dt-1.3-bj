var schema = require('./base/model')({
    user_id : { type : String, default : '' },//用户
    recharge: { type : Number, default : 0 },
    created : { type : Number, default : Date.now }
});

schema.index({ user_id: 1 })
schema.index({ created: 1 })

module.exports = schema
