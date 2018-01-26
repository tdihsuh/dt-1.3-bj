var library = module.exports = {}
var request = require("request");
var crypto = require('crypto');
const SMSClient = require('@alicloud/sms-sdk')

library.sendSMS = async function(params){
    // 短信发送的参数对象
    var obj = params;
    //生成签名并拼接请求参数链接
    // var signature = await dySign(obj);
    // obj.signature = signature;

    /**
     * 短信发送请求
     */

    // ACCESS_KEY_ID/ACCESS_KEY_SECRET 根据实际申请的账号信息进行替换
    const accessKeyId = 'LTAIZXlrSJPNsjg9'
    const secretAccessKey = 'mzEcmgONvMluacaEXp5znAqtYYECks'
    //初始化sms_client
    let smsClient = new SMSClient({accessKeyId, secretAccessKey})

    return new Promise((resolve, reject) => {
        //发送短信
        smsClient.sendSMS({
            PhoneNumbers: obj.PhoneNumbers,
            SignName: obj.SignName,
            TemplateCode: obj.TemplateCode,
            TemplateParam: obj.TemplateParam,
        }).then(function (res) {
            let {Code}=res
            if (Code === 'OK') {
                //处理返回参数
                console.log(res)
                return resolve(res);
            }
        }, function (err) {
            let Code= err.data.Code;
            console.log(err)
            if (Code === 'isv.BUSINESS_LIMIT_CONTROL'){
                return resolve('手机号申请次数过多');
            }else {
                return resolve(err);
            }
        });
    });
}

library.smsResult = async function (params) {
    let result = library.sendSMS(params)
    return result;
}
//加密规则，把所有参数按首字母排序，去掉引号和等号，拼接成字符串，使用md5生成签名
function dySign (obj) {
    var config = {
        AppKey: '5e77be5b-37ab-4a07-a9b0-2ee7dc5e554e',
        AppSecret: 'e395ef80-8814-4f04-938e-d80fd69bacae'
    };
    exports.config = config;
    // 程序key
    obj.app_key = config.AppKey;
    // 参数数组
    var arr = [];
    // 循环添加参数项
    for (var p in obj) {
        arr.push(p + obj[p]);
    }
    // 2、按首字母升序排列
    arr.sort();
    arr.unshift(config.AppSecret);
    arr.push(config.AppSecret);

    // 3、连接字符串
    var msg = arr.join('');
    // 生成签名 sign
    var signature = md5(msg);
    // 返回
    return signature.toUpperCase();
}
//md5生成签名
function md5(str) {
    let encrptStr = str;
    // console.log("加密前的key=" + encrptStr);
    var md5sum = crypto.createHash('md5');
    md5sum.update(encrptStr);
    encrptStr = md5sum.digest('hex');
    return encrptStr;
};

