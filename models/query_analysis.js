//查询统计
var schema = require('./base/model')({
    user_id       : { type : String, default : '' },//用户
    total         : { type : Number, default : 0 }, // 查询总数
    company_total : { type : Number, default : 0 }, // 企业查询总数
    company_hit   : { type : Number, default : 0 }, // 企业命中总数
    person_total  : { type : Number, default : 0 }, // 个人查询总数
    person_hit    : { type : Number, default : 0 }, // 个人命中总数
    created       : { type : Number, default : Date.now }
});

schema.index({ created: 1 })

module.exports = schema
