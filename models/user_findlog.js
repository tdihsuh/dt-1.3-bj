var schema = require('./base/model')({
    sign       : { type : String, default : '' }, //签名
    email      : { type : String, default : '' }, //邮箱
    timestamp  : { type : String ,default : ''},//时间戳
    secret     : { type : String ,default : ''},//随机串
    find_lose  : { type : Number ,default : ''},//该记录是否失效,0-失效，1保持
    created    : { type : Number, default : Date.now }
});

schema.index({ created: 1 })

module.exports = schema