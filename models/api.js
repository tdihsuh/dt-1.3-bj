var schema = require('./base/model')({
    name           : { type : String, default : '' }, // API名称
    identifier     : { type : String, default : '' }, // API标示
    uri            : { type : String, default : '' }, // API URI
    category       : { type : String, default : '' }, // API 分类 个人 - person 企业 - company
    description    : { type : String, default : '' }, // API描述
    provider       : { type : String, default : '' }, // 服务提供商
    provider_phone : { type : String, default : '' }, // 服务提供商联系方式
    price          : { type : Number, default : 0 }, //服务商计费价格
    billing_mode   : { type : Number, default : 0 }, //服务商计费模式 0 - 查询计费，1 - 查得计费
    created        : { type : Number, default : Date.now }
});

schema.index({ name: 1 })
schema.index({ identifier: 1 })
schema.index({ uri: 1 })
schema.index({ category: 1 })
schema.index({ billing_mode: 1 })
schema.index({ created: 1 })

module.exports = schema
