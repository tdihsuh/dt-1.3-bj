var schema = require('./base/model')({
    user_id      : { type : String, default : '' }, // 用户
    query        : { type : String, default : '' }, // 查询条件
    query_type   : { type : Number, default : 0 },  // 查询类型
    data         : { type : String, default : '' }, // 查询结果
    created      : { type : Number, default : Date.now }
});

schema.index({ user_id: 1 })
schema.index({ query: 1 })
schema.index({ created: 1 })

module.exports = schema
