var library = module.exports = {}
var request = require("request");
var crypto = require('crypto');
var config = require('config');


//获取微信openid和app_secret
library.wechat_request = async function(params){
    var obj = params;
    var options = {
        url: 'https://api.weixin.qq.com'+'/sns/jscode2session'
        + '?appid='+obj.appid+''
        +'&secret='+obj.secret+''
        +'&js_code='+obj.js_code+''
        +'&grant_type='+obj.grant_type+'',
        method: 'GET',
    };

    return new Promise((resolve, reject) => {
        request(
            options
            , (err, res, body) => {
                if (!err && res.statusCode == 200) {
                    console.log(body);
                    return resolve(body);
                }else{
                    return resolve(body);
                }
            });
    });
}

library.wechat_res = async function (params) {
    let result = library.wechat_request(params)
    return result;
}

//为微信小程序用户创建user
library.wechat_creat = async function(params){
    var obj = params;
    let dev_host = 'http://localhost:3000'
    let dir_host = 'http://admin.uniccat.com'

    var options = {
        url: dir_host +'/users',
        method: 'POST',
        form :obj
    };
    return new Promise((resolve, reject) => {
        request(
            options
            , (err, res, body) => {
                if (res.statusCode = 201){
                    body = {
                        msg : '创建成功',
                        status : 201
                    }
                    return resolve(body);
                }
            });
    });
}

library.wechat_creat_user = async function (params) {
    let result = library.wechat_creat(params)
    return result;
}

//为微信小程序用户创建apis
library.wechat_apis = async function(params){
    var obj = params;
    let dev_host = 'http://localhost:3000'
    let dir_host = 'http://admin.uniccat.com'

    var options = {
        url: dir_host +'/api_applies',
        method: 'POST',
        form :params
    };
    return new Promise((resolve, reject) => {
        request(
            options
            , (err, res, body) => {
                if (res.statusCode = 201){
                    body = {
                        msg : '授权成功',
                        status : 201
                    }
                    return resolve(body);
                }
            });
    });
}

library.wechat_api_apply = async function (params) {
    let result = library.wechat_apis(params)
    return result;
}

//小程序用户登录
library.wechat_login = async function(params){
    var obj = params;
    let dev_host = 'http://localhost:3000'
    let dir_host = 'https://uniccat.com'
    var options = {
        url: dir_host +'/api/v1/login'
        +'?userName='+params.username+''
        +'&password='+params.password+'',
        method: 'GET',
    };
    return new Promise((resolve, reject) => {
        request(options
            , (err, res, body) => {
                return resolve(body);
            });
    });
}

library.wechat_user_login = async function (params) {
    let result = library.wechat_login(params)
    return result;
}

//小程序用户获取api授权信息
library.wechat_apply = async function(params){
    var obj = params;
    let dev_host = 'http://localhost:3000'
    let dir_host = 'https://uniccat.com'
    var options = {
        url: dir_host +'/api/v1/users/'+params.user_id+''+'/apis',
        method: 'GET',
    };
    return new Promise((resolve, reject) => {
        request(options
            , (err, res, body) => {
                if (res.statusCode = 201){
                    return resolve(body);
                }else {
                    return resolve(body);
                }
            });
    });
}

library.wechat_user_apply = async function (params) {
    let result = library.wechat_apply(params)
    return result;
}