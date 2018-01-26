//角色
var schema = require('./base/model')({
    name    : { type : String, default : '' }, //角色名称
    role_id : { type : String, default : '' }, //角色标识
    description : { type : String, default : '' }, //描述
    created : { type : Number, default : Date.now } //创建时间
});

schema.index({ created: 1 })

module.exports = schema
