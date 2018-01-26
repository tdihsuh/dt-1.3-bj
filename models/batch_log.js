var schema = require('./base/model')({
    user_id  : { type : String, default : '' }, //角色名称
    batch_id : { type : String, default : '' }, //批量标识
    url      : { type : String, default : '' }, //七牛URL
    finished : { type : Number, default : 0 }, //已完成
    total    : { type : Number, default : 0 }, //总条数
    status   : { type : Number, default : 0 }, //状态
    created  : { type : Number, default : Date.now } //创建时间
});

schema.index({ created: 1 })

module.exports = schema
