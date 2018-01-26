var schema = require('./base/model')({
    message_type: { type : String, default : '升级提示' }, //消息类型
    content: { type : String, default : '消息内容' }, //消息内容
    target: { type : String, default : 'Web端用户' }, //消息对象
    from: { type : Number, default : Date.now },
    to: { type : Number, default : Date.now },
    created : { type : Number, default : Date.now }
});

schema.index({ created: 1 })

module.exports = schema
