//查询统计
var schema = require('./base/model')({
    api_id : { type: String, default: '' }, //API
    query  : { type: String, default: '' }, //查询参数
    data   : { type : String, default : '' }, //查询结果
    created: { type: Number, default: Date.now }
});

schema.index({ query: 1 })
schema.index({ api_id: 1 })
schema.index({ created: 1 })

module.exports = schema
