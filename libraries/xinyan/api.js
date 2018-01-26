var library = module.exports = {}
var request = require("request");


var fs = require('fs');
const crypto = require('crypto');
const privateKey = fs.readFileSync('./libraries/xinyan/zqxy_pri.pem', 'utf-8');
// const privateKey = fs.readFileSync('./zqxy_pri.pem', 'utf-8');
var config = {
    "serverXinYan": "http://api.xinyan.com",
    "charSet": "UTF-8",
    "pfxname": "zqxy_pri.pfx",
    "pfxpwd": "zqxy",
    "cername": "zqxy_pub.cer",
    "terminalid": "8039206686",
    "memberid": "8039206686",
    "datatype": "json"
}

//固定参数新颜
const serverXinYan = config.serverXinYan;
const member_id = config.memberid;
const terminal_id = config.terminalid;
let industry_type = "A1";

library.getFZData = async function (_params) {

    let trans_id = Date.now();
    let trade_date = new Date().Format("yyyyMMddHHmmss");
    let params = {
        'member_id': member_id,
        'product_type': "0",
        'id_card': _params.idCode,
        'name': _params.realName,
        'trans_id': trans_id.toString(),
        'industry_type': industry_type,
        'trade_date': trade_date.toString(),
        'terminal_id': terminal_id.toString(),
    }
    let paramStr = JSON.stringify(params);
    // console.log("============请求明文=========\n" + paramStr);
    // console.log("============请求明文=========");
    var eData = encryptByKey(paramStr);
    // console.log("============加密串=========\n" + eData);
    // console.log("============加密串=========");
    var params2 = {
        'member_id': member_id,
        'terminal_id': terminal_id,
        'data_type': "json",
        'data_content': eData
    }
    var options = {
        url: serverXinYan + '/product/identity/v1/personMark',
        method: "POST",
        // headers:headers
        form: params2
    }
    return new Promise((resolve, reject) => {
        request(
            options
            , (err, res, body) => {
                if (!err && res.statusCode == 200) {
                    return resolve(body);
                }
            });
    });
}

library.getFZResult = async function (params) {
    let result = library.getFZData(params)
    return result;
}

function encryptByKey(stuff) {
    let encryptString = Buffer.from(Buffer.from(stuff).toString('base64'));
    let result = '';
    while (encryptString.length > 117) {
        const chunk = encryptString.slice(0, 117);
        encryptString = encryptString.slice(117);
        result += crypto.privateEncrypt(privateKey, chunk).toString('hex');
    }
    result += crypto.privateEncrypt(privateKey, encryptString).toString('hex');
    return result;
}

Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
/*var geoAPI = this.library('geo/api')

geoAPI.getData({}, function (result) {
    console.log(result)
});*/
test2 = async function () {
    let params = {
        'realName': "青松军",
        'idCode': "510921198501245354",
        'phoneNumber': "18511664375",
    }

    let result = await library.getFZResult(params);

    // console.log("final result:" + result);
}
