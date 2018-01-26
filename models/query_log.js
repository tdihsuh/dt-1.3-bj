//查询统计
var schema = require('./base/model')({
    user_id      : { type: String, default: '' }, //用户
    batch_id     : { type: String, default: '' }, //批量查询 id
    group_id     : { type: String, default: '' }, //API分组 id

    queries      : [],
    /*
    apply        : {}, //API授权信息
    api          : {}, //API信息
    charged      : { type: Number, default: 0 },  //实际扣费
    query        : { type: String, default: '' }, //查询参数
    query_type   : { type: String, default: '' }, //查询类型 0个人,1企业
    query_status : { type: Number, default: 0 },  //查询状态 0-未查得， 1-查得
    data         : { type: String, default: '' }, //查询结果
    */

    created      : { type: Number, default: Date.now }
});

schema.index({ user_id: 1 })
schema.index({ 'queries.apply_id': 1 })
schema.index({ 'queries.api._id': 1 })
schema.index({ 'queries.query_type': 1 })
schema.index({ 'queries.query_status': 1 })
schema.index({ batch_id: 1 })
schema.index({ group_id: 1 })
schema.index({ created: 1 })

module.exports = schema
