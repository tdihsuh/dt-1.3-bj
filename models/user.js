//用户
var schema = require('./base/model')({
    //账号信息
    username    : { type : String, default : '' }, //用户名
    nickname    : { type : String, default : '' }, //用户昵称
    password    : { type : String, default : '' }, //密码
    avatar      : { type : String, default : '' }, //头像
    user_group  : { type : String, default : '' }, //所属客户标签
    company     : { type : String, default : '' }, //公司名称

    //个人基本信息
    age         : { type : Number, default : 0 },
    gender      : { type : Number, default : 0 },
    birthday    : { type : String, default : '' },
    blood       : { type : String, default : '' },
    horoscope   : { type : String, default : '' },
    height      : { type : Number, default : 0 },
    weight      : { type : Number, default : 0 },
    hobby       : { type : String, default : '' },
    bust        : { type : Number, default : 0 },
    waistline   : { type : Number, default : 0 },
    hipline     : { type : Number, default : 0 },

    //联系方式
    mobile      : { type : String, default : '' },//手机号
    email       : { type : String, default : '' },//邮箱
    qq          : { type : String, default : '' },
    weixin      : { type : String, default : '' },
    weibo       : { type : String, default : '' },

    role        : { type : String, default : '' },
    balance     : { type : Number, default : 0 },

    trial         : { type : Number, default : 0 },//试用
    apis          : { type : String, default : '' }, //用户选择api接口
    desc          : { type : String, default : '' }, //处理描述
    identity_code : { type : String, default : '' }, //企业统一识别码
    photo_url     : { type : String, default : '' }, //营业执照地址
    contact_name  : { type : String, default : '' }, //联系人姓名

    uniform       : { type : String, default : '' }, //公司ip
    status        : { type : Number, default : 0 }, //处理状态:0待处理，1开通，2拒绝
    operate_person: { type : String, default : '' }, //操作人
    operate_date  : { type : Number, default : Date.now }, //操作时间
    //APPKEY APP_SECRET
    app_key     : { type : String, default : '' },
    app_secret  : { type : String, default : '' },

    is_notice   : { type : Number, default : 0 },//是否通知用户可用余额少于2000，0-通知，1-不通知
    last_login  : { type : Number, default : 0 },
    created     : { type : Number, default : Date.now }
});

schema.index({ gps: '2d' })
schema.index({ username: 1 })
schema.index({ company: 1 })
schema.index({ created: 1 })

module.exports = schema
