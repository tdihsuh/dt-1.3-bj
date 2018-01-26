var library = module.exports = {}
var user = 'test';
var key = "creditchina12345";
var service = 'http://www.creditchina.gov.cn/openAPI/'

library.getBasicInfo = async function (ent_name, credit_no) {
    /*信用信息   URL 必填参数 user (用户名)
    * URL 选填参数 entname(主体名称)，creditCode(统一代码)
     */
    var method = 'getBasicInfo';
    /*行政许可
     URL 必填参数 user (用户名)
     URL 选填参数
     entname(主体名称)，creditCode(统一代码)
    * */
    //  var method ='getPubPermission';
    //var entInfoModel = ctx.model('ent_info');
    //  var row = await  entInfoModel.getRow({'ent_name':'克拉玛依市宝昌工贸有限公司'})
    var options = {
        url: service + method + '?user=' + user + '&entname=' + encodeURIComponent(ent_name)+'&creditCode='+credit_no,
        method: "GET",
    }
    var result = await  getData(options, key);
    return result
}

library.getRecord = async function (ent_name, credit_no) {
    /**
     * 统一代码
     *URL 必填参数 user (用户名)
     *URL 选填参 entname(主体名称)，creditCode (统一代码)
     */
    var method = 'getCreditCode';
    var options = {
        url: service + method + '?user=' + user + '&entname=' + encodeURIComponent(ent_name)+'&creditCode='+credit_no,
        method: "GET",
    }
    var result = await  getData(options, key);
    return result
}
library.getPubPenalty = async function (ent_name, credit_no) {

    /*行政处罚
    URL 必填参数 user (用户名)
    URL 选填参数  entname(主体名称)，creditCode (统一代码)
    * */
    var method = 'getPubPenalty';
    var options = {
        url: service + method + '?user=' + user + '&entname=' + encodeURIComponent(ent_name)+'&creditCode='+credit_no,
        method: "GET",
    }
    var result = await  getData(options, key);
    return result
}

function getData(options, key) {
    var request = require("request");
    return new Promise((resolve, reject) => {
        request(
            options, (err, res, body) => {
                if (!err && res.statusCode == 200) {
                    var response = decryption(body, key)
                    console.log(response);
                    return resolve(response);
                } else if (res.statusCode == 501) {
                    return resolve('服务器异常');
                } else {
                    return reject(err);
                }
            });
    });
}

function decryption(data, key) {
    var crypto = require('crypto');
    var iv = "";
    var clearEncoding = 'utf8';
    var cipherEncoding = 'base64';
    var cipherChunks = [];
    var decipher = crypto.createDecipheriv('aes-128-ecb', key, iv);
    decipher.setAutoPadding(true);
    cipherChunks.push(decipher.update(data, cipherEncoding, clearEncoding));
    cipherChunks.push(decipher.final(clearEncoding));
    return cipherChunks.join('');
}


