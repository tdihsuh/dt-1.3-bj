var path = require('path');
var aesutil = module.exports = {};
const key = "zhongqingxinyong";
var iv = "";
var request = require("request");
var qs = require("querystring");
var aesUtil = require("./aes");
var config = global.config;
var Redis = require('ioredis');
// redis 链接
var client = new Redis(config.get('redis'));

let token = "SYSAPITKM:be31ace3ba44c985361a8fe66afa1636";
client.on('error', function (e) {
    console.error("error:" + e);
});
client.on('connect', function (e) {
    console.log("# redis connected.");
    // client.set("api:geo:token", "");
    client.get('api:geo:token', function (err, result) {
        token = result;
    });
});
client.on('close', function (e) {
    console.log("close:" + e);
});

var Config = {
    "serverGeo": "http://yz.geotmt.com",
    "encryptionType": "AES2",
    "encryptionKey": "zhongqingxinyong",
    "username": "zqxy",
    "password": "Zqxy@geo.123",
    "uno": "200603",
    "etype": "RSA",
    "dsign": 0
}
//固定参数GEO
const serverGeo = Config.serverGeo;
const uno = Config.uno;
const username = Config.username;
const password = Config.password;
const encrypted = "1";

/**
 * aes加密
 * @param data 待加密内容
 * @param key 必须为32位私钥
 * @returns {string}
 */
var self = this;
aesutil.getDTJDData = async function (_params) {
    let innerIfType = aesUtil.encryption("T40301");
    let realName = aesUtil.encryption(_params.realName);
    let idNumber = aesUtil.encryption(_params.idCode);
    let cid = aesUtil.encryption(_params.phoneNumber);
    let authCode = aesUtil.encryption(getAuthCode(uno + ":" + _params.phoneNumber, 32));
    client.on('connect', async function (e) {
        client.get('api:geo:token', async function (err, result) {
            token = await result;
        });
    });
    let params = {
        'tokenId': token,
        'innerIfType': innerIfType.toUpperCase(),
        'cid': cid.toUpperCase(),
        'idNumber': idNumber.toUpperCase(),
        'realName': realName.toUpperCase(),
        'authCode': authCode.toUpperCase()
    }
    var content = qs.stringify(params);

    // var getData = () => {
    return new Promise((resolve, reject) => {
        request({
            url: serverGeo + '/civp/getview/api/u/queryUnify?' + content,
        }, (err, res, body) => {
            if (body == undefined) {
                return resolve("{'code':'504','msg':'need token!'}")
            }
            if (body.startsWith("{")) {
                return resolve("{'code':'400','msg':'need token!'}");
            }
            return resolve(body);
        });
    });
    // };


}

aesutil.getJRYQData = async function (_params) {
    let innerIfType = aesUtil.encryption("T20103");
    let realName = aesUtil.encryption(_params.realName);
    let idNumber = aesUtil.encryption(_params.idCode);
    let cid = aesUtil.encryption(_params.phoneNumber);
    let authCode = aesUtil.encryption(getAuthCode(uno + ":" + _params.phoneNumber, 32));
    client.on('connect', async function (e) {
        client.get('api:geo:token', async function (err, result) {
            token = await result;
        });
    });
    let params = {
        'tokenId': token,
        'innerIfType': innerIfType.toUpperCase(),
        'cid': cid.toUpperCase(),
        'idNumber': idNumber.toUpperCase(),
        'realName': realName.toUpperCase(),
        'authCode': authCode.toUpperCase()
    }
    var content = qs.stringify(params);

    return new Promise((resolve, reject) => {
        request({
            url: serverGeo + '/civp/getview/api/u/queryUnify?' + content,
        }, (err, res, body) => {
            if (body == undefined) {
                return resolve("{'code':'504','msg':'need token!'}")
            }
            if (body.startsWith("{")) {
                return resolve("{'code':'400','msg':'need token!'}");
            }
            return resolve(body);
        });
    });
}


aesutil.loginGeo = async function () {
    let userName = aesUtil.encryption(username);
    let passWord = aesUtil.encryption(password);
    let unoE = uno;
    let dsign = aesUtil.encryption("0" + "");
    let params = {
        'username': userName.toUpperCase(),
        'password': passWord.toUpperCase(),
        'uno': unoE,
        'encrypted': encrypted,
        'dsign': dsign.toUpperCase()
    }
    var content = qs.stringify(params);

    return new Promise((resolve, reject) => {
        request({
            url: serverGeo + '/civp/getview/api/o/login?' + content,
        }, (err, res, body) => {
            if (err) {
                reject(err);
            }
            var result1 = JSON.parse(aesUtil.decryption(body));
            token = result1.data.tokenId;
            client.set("api:geo:token", token);
            client.on('connect', function (e) {
                client.get('api:geo:token', function (err, result) {
                });
            });
            return resolve("got token!");
        });
    });

}

function getAuthCode(str, strLength) {
    var strLen = str.length;
    if (strLen < strLength) {
        var sb = str;
        while (strLen < strLength) {
            sb = sb + "0"; // 右补0
            strLen = sb.length;
        }
        str = sb;
    } else {
        str = str.substring(0, strLength);
    }
    return str;
}

aesutil.getDTJDResult = async function (params) {
    var result = {}
    try {
        var data = await aesutil.getDTJDData(params);
        var dataStr = data + "";
        if (dataStr.startsWith("{")) {
            const login = await  aesutil.loginGeo();
            data = await aesutil.getDTJDData(params);
        }
        result = aesUtil.decryption(data);
    } catch (err) {
        console.log(err);
    }
    return result;
};

aesutil.getJRYQResult = async function (params) {
    var result = {}
    try {
        var data = await aesutil.getJRYQData(params);
        var dataStr = data + "";
        if (dataStr.startsWith("{")) {
            const login = await  aesutil.loginGeo();
            data = await aesutil.getJRYQData(params);
        }
        // console.log(aesUtil.decryption(data));
        result = aesUtil.decryption(data);
    } catch (err) {
        console.log(err);
    }
    // console.log("final result:"+result);
    return result;
};

test = async function () {
    var param = {
        'realName': "青松军",
        'idCode': "510921198501245354",
        'phoneNumber': "13802729377",
    }
    let result = await aesutil.getDTJDResult(param);
    let result2 = await aesutil.getJRYQResult(param);

    // console.log("final result:"+result);

    // console.log("final result2:"+result2);

    // new Promise(function(res, rej) {
    //     aesutil.getDTJDData(param)
    //     console.log(Date.now() + " start setTimeout 1");
    //     setTimeout(res, 2000);
    // }).then(function() {
    //     console.log(Date.now() + " timeout 1 call back");
    //     return new Promise(function(res, rej) {
    //         console.log(Date.now() + " start setTimeout 2");
    //         setTimeout(res, 3000);
    //     });
    // }).then(function() {
    //     console.log(Date.now() + " timeout 2 call back");
    //     return new Promise(function(res, rej) {
    //         console.log(Date.now() + " start setTimeout 3");
    //         setTimeout(res, 4000);
    //     });
    // }).then(function() {
    //     console.log(Date.now() + " timeout 3 call back");
    //     return new Promise(function(res, rej) {
    //         console.log(Date.now() + " start setTimeout 4");
    //         setTimeout(res, 5000);
    //     });
    // }).then(function() {
    //     console.log(Date.now() + " timeout 4 call back");
    // });
    // console.log(data2);
}
