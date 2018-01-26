//API授权
var schema = require('./base/model')({
    user_id        : { type : String, default : '' }, // 用户
    api_id         : { type : String, default : '' }, // API
    status         : { type : Number, default : 1 },  // API授权状态 1 - 正常，0 - 禁用
    price          : { type : Number, default : 0 },  // 客户计费价格
    billing_mode   : { type : Number, default : 0 },  // 客户计费模式 0 - 查询计费，1 - 查得计费
    query_type     : { type : String, default : 'WEB' },  // 客户查询方式 WEB - WEB端查询，API - API查询
    created        : { type : Number, default : Date.now }
});

schema.index({ user_id: 1 })
schema.index({ api_id: 1 })
schema.index({ status: 1 })
schema.index({ created: 1 })

module.exports = schema
