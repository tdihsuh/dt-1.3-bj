//客户标签
var schema = require('./base/model')({
  name        : { type : String, default : '' }, //名称
  description : { type : String, default : '' }, //描述
  type        : { type : String ,default : ''},//客户标签类型
  created     : { type : Number, default : Date.now }
});

schema.index({ created: 1 })

module.exports = schema
