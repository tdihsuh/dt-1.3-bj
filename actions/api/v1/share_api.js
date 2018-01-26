module.exports = function ($) {
    //个人查询
    var crypto = require('crypto');
    const prefix = "koa2:user:";
    // const prefix = "koa:user:";
    const SECRET_EXPIRETIME = 60;
    let returnAll = {}
    $.get('/share/query/person', async (ctx, next) => {
        let self = ctx;
        let _params = self.request.query
        let nowTime = Date.now();
        var funcs = self.library('func')
        var params = {
            'appKey': _params.appKey,
            'digitalSignature': _params.digitalSignature,
            'idCode': _params.idCode,
            'phoneNumber': _params.phoneNumber,
            'realName': _params.realName,
            'service': _params.service,
            'timestamp': _params.timestamp
        }
        //验证时间
        let TIME_DURING = 1000 * 60;  //时间间隔  1分钟
        // console.log('时间间隔=' + (nowTime - _params.timestamp));
        if (nowTime - _params.timestamp > TIME_DURING) {
            returnAll = {
                code: 400,
                msg: '请求超时'
            }
            self.body = returnAll;
            return
        }
        //防重放攻击
        // console.log("self.nonce" + md5(_params.timestamp, _params.appKey));
        // let nonce = md5(_params.timestamp,_params.appKey);
        let nonce = md5(_params.timestamp, _params.appKey);
        if (await self.redis.setnx(prefix + nonce, nonce) === 0) {
            returnAll = {
                code: 400,
                msg: '请求失败'
            }
            return self.body = returnAll;
        }
        //放入nonce集合
        self.redis.expire(prefix + nonce, 180);
        //获取用户信息
        var userModel = self.model('user');
        var user = await userModel.getRow({'app_key': _params.appKey});
        if (!user) {
            self.status = 408;
            self.body = '用户不存在';
            return;
        }
        let user_id = user._id;
        //签名认证 用appkey取appSecret  MD5校验
        // self.redis.set(prefix + _params.appKey, "1234");
        var secret = user.app_secret;
        var strContent = paramToStr(params)
        var md5Content = md5(strContent, secret);
        var md5ContentUp = md5Content.toUpperCase();
        // console.log('MD5加密结果=' + md5ContentUp);
        if (md5ContentUp !== _params.digitalSignature) {
            returnAll = {
                code: 400,
                msg: '校验不通过'
            }
            self.body = returnAll
            return
        }
        var apiModel = self.model('api');
        var apiApplyModel = self.model('api_apply');
        //MD5校验 解析服务类型
        var arr = _params.service.split(',');
        if (arr.length > 0) {
            //解析 gaofa duotou jinrong fanzui  =>指向不同的请求
            var element_gaoFa = null, element_duoTou = null, element_jinRon = null, element_fanZui = null;
            if (arr.includes('gaofa')) {
                let result = null;
                if (await funcs.check_params(params, 2) !== "success") {
                    returnAll = {
                        code: 403,
                        msg: await funcs.check_params(params, 2)
                    }
                    self.body = returnAll
                    return
                }
                let query = {
                    identity_name: _params.realName,
                    identity_code: _params.idCode
                };
                let query_type = 0;
                let query_status = 0;
                let api = await apiModel.getRow({'identifier': 'gaofa'});
                let api_id = api._id + "";
                let apply = await apiApplyModel.getRow({
                    'user_id': user_id,
                    'api_id': api_id
                });
                if (!apply) {
                    self.status = 405;
                    self.body = '尚未授权';
                    return;
                }
                let apply_id = apply._id;
                //检查余额
                /*  if (!await funcs.check_balance(user_id, apply_id, self)) {
                      self.status = 403;
                      self.body = '余额不足';
                      return;
                  }*/

                //是否已经查询过
                let queried = await funcs.isQueried(api_id, query, self);
                if (queried) {
                    result = JSON.parse(queried.data);
                    query_status = 1;
                } else {
                    var personInfoModel = self.model('person_info');
                    var row = await personInfoModel.getRow({
                        'entity_name': _params.realName,
                        'identify_code': _params.idCode
                    })
                    if (row) {
                        result = row.data[0].sp;
                        query_status = 1;
                    }
                }
                //保存到查询历史
                if (query_status == 1) {
                    await funcs.saveToQueryHistory(api_id, JSON.stringify(query), JSON.stringify(result), self)
                }
                //保存到查询日志
                await funcs.saveToQueryLog(user_id, api_id, apply_id, '', "", JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)
                if (result != null && result != "") {
                    element_gaoFa = result
                } else {
                    element_gaoFa = []
                }
                returnAll = {
                    code: 200,
                    'result': element_gaoFa,
                    msg: '请求成功'
                }
            }
            if (arr.includes('duotou')) {
                let result = null;
                if (await funcs.check_params(params, 3) !== "success") {
                    returnAll = {
                        code: 403,
                        msg: await funcs.check_params(params, 3)
                    }
                    self.body = returnAll
                    return
                }
                let query = {
                    identity_name: _params.realName,
                    identity_code: _params.idCode,
                    mobile: _params.phoneNumber
                };
                let query_type = 0;
                let query_status = 0;
                let api = await apiModel.getRow({'identifier': 'duotou'});
                let api_id = api._id + "";
                let apply = await apiApplyModel.getRow({
                    'user_id': user_id,
                    'api_id': api_id
                });
                if (!apply) {
                    self.status = 405;
                    self.body = '尚未授权';
                    return;
                }
                let apply_id = apply._id;
                //检查余额
                /*          if (!await funcs.check_balance(user_id, apply_id, self)) {
                              self.status = 403;
                              self.body = '余额不足';
                              return;
                          }*/
                //是否已经查询过
                var queried = await funcs.isQueried(api_id, query, self);
                if (queried) {
                    console.log(queried.data);
                    result = JSON.parse(queried.data);
                    //query_status = 1;
                } else {

                }
                /*        //保存到查询历史
                        if (query_status == 1) {
                            await funcs.saveToQueryHistory(api_id, JSON.stringify(query), JSON.stringify(result), self)
                        }
        */
                //保存到查询日志
                await funcs.saveToQueryLog(user_id, api_id, apply_id, '', "", JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)
                if (result != null && result != '') {
                    element_duoTou = result;
                } else {
                    element_duoTou = {}
                }

                returnAll = {
                    code: 200,
                    'result': element_duoTou,
                    msg: '请求成功'
                }
            }
            if (arr.includes('jinrong')) {
                let result = {};
                if (await funcs.check_params(_params, 3) !== "success") {
                    returnAll = {
                        code: 403,
                        msg: await  funcs.check_params(_params, 3)
                    }
                    self.body = returnAll
                    return
                }
                let query = {
                    identity_name: _params.realName,
                    identity_code: _params.idCode,
                    mobile: _params.phoneNumber
                };
                let query_type = 0;
                let query_status = 0;
                let api = await apiModel.getRow({'identifier': 'jinrong'});
                let api_id = api._id + "";
                let apply = await apiApplyModel.getRow({
                    'user_id': user_id,
                    'api_id': api_id
                });
                if (!apply) {
                    self.status = 405;
                    self.body = '尚未授权';
                    return;
                }
                let apply_id = apply._id;
                //检查余额
                /*      if (!await funcs.check_balance(user_id, apply_id, self)) {
                          self.status = 403;
                          self.body = '余额不足';
                          return;
                      }*/
                //是否已经查询过
                let queried = await funcs.isQueried(api_id, query, self);
                if (queried) {
                    result = JSON.parse(queried.data);
                    //    query_status = 1;
                } else {
                    /*try {
                        result = await jinRongYuQi(self, _params);
                        if (result != "") {
                            query_status = 1;
                        }
                    } catch (e) {
                    }*/
                }
                //保存到查询历史
                /*       if (query_status == 1) {
                           await funcs.saveToQueryHistory(api_id, JSON.stringify(query), JSON.stringify(result), self)
                       }*/
                //保存到查询日志
                await funcs.saveToQueryLog(user_id, api_id, apply_id, '', "", JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)
                if (result != null && result != '') {
                    element_jinRon = JSON.parse(result);
                } else {
                    element_jinRon = {}
                }
                returnAll = {
                    code: 200,
                    'result': element_jinRon,
                    msg: '请求成功'
                }
            }
            if (arr.includes('fanzui')) {
                let result = {};
                if (await funcs.check_params(_params, 2) !== "success") {
                    returnAll = {
                        code: 403,
                        msg: await  funcs.check_params(_params, 2)
                    }
                    self.body = returnAll
                    return
                }
                let query = {
                    identity_name: _params.realName,
                    identity_code: _params.idCode,
                    mobile: _params.phoneNumber
                };
                let query_type = 0;
                let query_status = 0;
                let api = await apiModel.getRow({'identifier': 'fanzui'});
                let api_id = api._id + "";
                let apply = await apiApplyModel.getRow({
                    'user_id': user_id,
                    'api_id': api_id
                });
                if (!apply) {
                    self.status = 405;
                    self.body = '尚未授权';
                    return;
                }
                let apply_id = apply._id;
                //检查余额
                /*         if (!await funcs.check_balance(user_id, apply_id, self)) {
                             self.status = 403;
                             self.body = '余额不足';
                             return;
                         }*/
                //是否已经查询过
                let queried = await funcs.isQueried(api_id, query, self);
                if (queried) {
                    result = JSON.parse(queried.data);
                    query_status = 1;
                } else {
                    /*   try {
                           let row = await fanZuXinXi(self, _params);
                           if (row.success && row.data && row.data.markResult && row.data.markResult != '正常') {
                               query_status = 1;
                           }
                           result = await fanZuXinXi(self, _params);
                       } catch (e) {

                       }*/
                }
                //保存到查询历史
                /*             if (query_status == 1) {
                                 await funcs.saveToQueryHistory(api_id, JSON.stringify(query), JSON.stringify(result), self)
                             }*/
                //保存到查询日志
                await funcs.saveToQueryLog(user_id, api_id, apply_id, '', "", JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)

                if (result != null && result != '') {
                    element_fanZui = result;
                } else {
                    element_fanZui = {}
                }
                returnAll = {
                    code: 200,
                    'result': element_fanZui,
                    msg: '请求成功'
                }
            }

        } else {
            returnAll = {
                code: 400,
                msg: '请求类型必填参数或参数不合法'
            }
        }
        self.body = returnAll;
    })

    $.get("/share/query/company", async (ctx, next) => {
        var self = ctx;
        var status = 201;
        var funcs = self.library('func')
        let _params = self.request.query;
        let nowTime = Date.now();
        var params = {
            'appKey': _params.appKey,
            'digitalSignature': _params.digitalSignature,
            'ent_info': _params.ent_info,
            'timestamp': _params.timestamp
        }

        //验证时间
        let TIME_DURING = 1000 * 60;  //时间间隔  1分钟
        // console.log('时间间隔=' + (nowTime - _params.timestamp));
        if (nowTime - _params.timestamp > TIME_DURING) {
            status = 400;
            returnAll = {
                code: 400,
                msg: '请求超时'
            }
            self.body = returnAll;
            return
        }
        //防重放攻击
        // console.log("self.nonce" + md5(_params.timestamp, _params.appKey));
        // let nonce = md5(_params.timestamp,_params.appKey);
        let nonce = md5(_params.timestamp, _params.appKey);
        if (await self.redis.setnx(prefix + nonce, nonce) === 0) {
            status = 400;
            returnAll = {
                code: 400,
                msg: '请求失败'
            }
            return self.body = returnAll;
        }
        //放入nonce集合
        self.redis.expire(prefix + nonce, 120);

        //获取用户信息
        var userModel = self.model('user');
        var user = await userModel.getRow({'app_key': _params.appKey});
        if (!user) {
            self.status = 408;
            self.body = '用户不存在';
            return;
        }
        let user_id = user._id;
        //签名认证 用appkey取appSecret  MD5校验
        // self.redis.set(prefix + _params.appKey, "1234");
        var secret = user.app_secret;
        var strContent = paramEnterpriseToStr(params)
        var md5Content = md5(strContent, secret);
        var md5ContentUp = md5Content.toUpperCase();
        // console.log('MD5加密结果=' + md5ContentUp);
        if (md5ContentUp !== _params.digitalSignature) {
            status = 400;
            returnAll = {
                code: 400,
                msg: '校验不通过'
            }
            self.body = returnAll
            return
        }
        var apiModel = self.model('api');
        var apiApplyModel = self.model('api_apply');
        let api = await apiModel.getRow({'identifier': 'entinfo'});
        let api_id = api._id + "";
        // {'user_id': '5a1389ba245885967e6516e4','apply_type':1,'apis':'59f936826b12252a7440f495'}
        let apply = await apiApplyModel.getRow({
            'user_id': user_id,
            'api_id': api_id
        });
        if (!apply) {
            self.status = 405;
            self.body = '尚未授权';
            return;
        }

        let apply_id = apply._id;

        //检查余额
        if (!await funcs.check_balance(user_id, apply_id, self)) {
            self.status = 403;
            self.body = '余额不足';
            return;
        }
        var result = {
            code: 200,
            data: {},
            tags: [],
        };

        var query_type = 1;
        var query_status = 0;
        var query = {}
        var ent_name = JSON.parse(_params.ent_info).ent_name;
        var credit_no = JSON.parse(_params.ent_info).credit_no;
        if (ent_name) {
            query.ent_name = ent_name
        }
        if (credit_no) {
            query.credit_no = credit_no
        }

        var entInfoModel = self.model('ent_info');
        var row = await entInfoModel.getRow(query);
        if (row) {
            result = {
                code: 200,
                data: row.ent_info,
                tags: row.data,
            }
            query_status = 1;
        }

        /*
                //保存到查询历史
                if (query_status == 1) {
                    await funcs.saveToQueryHistory(api_id, JSON.stringify(query), JSON.stringify(result), self)
                }
        */
        //保存到查询日志
        await funcs.saveToQueryLog(user_id, api_id, apply_id, '', "", JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)
        // 查api库,获取api信息
        self.body = result;

    });

    function md5(str, secret) {
        let encrptStr = secret + str;
        // console.log("加密前的key=" + encrptStr);
        var md5sum = crypto.createHash('md5');
        md5sum.update(encrptStr);
        encrptStr = md5sum.digest('hex');
        return encrptStr;
    };

    function paramToStr(params) {
        let paramStr = 'appKey' + params.appKey + 'idCode' + params.idCode + 'phoneNumber' + params.phoneNumber + 'realName' + params.realName + 'service' + params.service + 'timestamp' + params.timestamp;
        // console.log("paramStr=" + paramStr);
        return paramStr;
    }

    function paramEnterpriseToStr(params) {
        let paramStr = 'appKey' + params.appKey + 'ent_info' + params.ent_info + 'timestamp' + params.timestamp;
        // console.log("paramStr=" + paramStr);
        return paramStr;
    }

    function SubTime(nowTime) {
        let time = nowTime + ''; // 声明变量。
        time = time.substr(0, 9); // 获取9位字符串。
        return (time); // 返回 9位时间戳。
    }


//多头借贷
    async function duoTouJieDai(self, _params) {
        let geoApi = self.library("geo/api");
        let result = {};
        // let xinyanApi = self.library("xinyan/api");
        let params = {
            'realName': _params.realName,
            'idCode': _params.idCode,
            'phoneNumber': _params.phoneNumber,
        }
        // console.log(params);
        try {
            var data = await geoApi.getDTJDResult(params);
            let rel = JSON.parse(data);
            if (rel.data.RSL[0].RS.code == "-9999") {
                let result0 = rel.data.RSL[0].RS.desc ? rel.data.RSL[0].RS.desc : '';
                let rslJson = JSON.parse(result0);
                if (rslJson.result_xdpt != null) {
                    for (let i = 0; i < rslJson.result_xdpt.length; i++) {
                        let cur = rslJson.result_xdpt[i];
                        rslJson.result_xdpt[i].PLATFORMCODE = await cur.PLATFORMCODE.replace("EMAY", "HMC").replace("GEO", "HMC");
                    }
                }
                if (rslJson.result_dksq != null) {
                    for (let i = 0; i < rslJson.result_dksq.length; i++) {
                        let cur = rslJson.result_dksq[i];
                        rslJson.result_dksq[i].PLATFORMCODE = await cur.PLATFORMCODE.replace("EMAY", "HMC").replace("GEO", "HMC");
                    }
                }
                if (rslJson.result_dkfk != null) {
                    for (let i = 0; i < rslJson.result_dkfk.length; i++) {
                        let cur = rslJson.result_dkfk[i];
                        rslJson.result_dkfk[i].PLATFORMCODE = await cur.PLATFORMCODE.replace("EMAY", "HMC").replace("GEO", "HMC");
                    }
                }
                if (rslJson.result_dkbh != null) {
                    for (let i = 0; i < rslJson.result_dkbh.length; i++) {
                        let cur = rslJson.result_dkbh[i];
                        rslJson.result_dkbh[i].PLATFORMCODE = await cur.PLATFORMCODE.replace("EMAY", "HMC").replace("GEO", "HMC");
                    }
                }
                result = rslJson;
            } else {
                result = "";
            }
        } catch (a) {
            result = ""
            return result
        }

        return result;
    }

//高法失信
    async function gaoFaShiXing(self, _params) {
        let result = {};
        let personId
        let gerenModel = self.model('person_info')
        let personRow = await gerenModel.getRow({
            'entity_name': _params.realName,
            'identify_code': _params.idCode,
        });
        if (personRow) {
            personId = personRow.person_id
        } else {
            return null
        }
        //高法失信库
        if (personId) {
            // yield function (callback) {
            let gaofaModel = self.model('fraud_individual')
            gaofaModel.getRows({'person_id': personId,}, {}, function (a, b) {
                if (!a) {
                    self.status = 200
                    result = b ? b : ''
                } else {
                    result = null
                }
                return result;
            })
        }
    }

//金融逾期
    async function jinRongYuQi(self, _params) {
        let geoApi = self.library("geo/api");
        let result = {};
        let params = {
            'realName': _params.realName,
            'idCode': _params.idCode,
            'phoneNumber': _params.phoneNumber,
        }
        try {
            var data = await geoApi.getJRYQResult(params);
            let rel = JSON.parse(data)
            result = rel.data.RSL[0].RS.desc ? rel.data.RSL[0].RS.desc : '';
            var re = JSON.parse(result)
            if (re.result_xdpt == '') {
                result = ""
            }
        } catch (a) {
            result = ""
            return result
        }
        return result;
    }
//犯罪信息
    async function fanZuXinXi(self, _params) {
        let result = {};
        let xinyanApi = self.library("xinyan/api");
        let params = {
            'realName': _params.realName,
            'idCode': _params.idCode,
            'phoneNumber': _params.phoneNumber,
        }
        try {
            var data = await  xinyanApi.getFZResult(params);
            let rel = JSON.parse(data)
            result = rel
        } catch (a) {
            result = ''
            return result
        }
        return result;
    }
    $.get('/share/xyzg', async (ctx, next) => {
        const user = 'test';
        const key = "creditchina12345";
        const service = 'http://www.creditchina.gov.cn/openAPI/'
        /*信用信息   URL 必填参数 user (用户名)
        * URL 选填参数 entname(主体名称)，creditCode(统一代码)
         */
      //  var method = 'getBasicInfo';
        /*行政许可
         URL 必填参数 user (用户名)
         URL 选填参数
         entname(主体名称)，creditCode(统一代码)
        * */
        //  var method ='getPubPermission';
        /*行政处罚
        URL 必填参数 user (用户名)
        URL 选填参数  entname(主体名称)，creditCode (统一代码)
        * */

         var method ='getPubPenalty';
        /**记录
         *    URL 必填参数  user(用户名) entname(主体名称) dataType(数据类型)默认 0    (见附件 1)
         */
        //  var method ='getRecord';
        /**
         * 统一代码
         *URL 必填参数 user (用户名)
         *URL 选填参 entname(主体名称)，creditCode (统一代码)
         */
        //   var method ='getCreditCode';
        var entInfoModel = ctx.model('ent_info');
            var row = await  entInfoModel.getRow({'ent_name':'克拉玛依市宝昌工贸有限公司'})
        console.log(row);

        var options = {
            url: service + method + '?user=' + user + '&entname=' + encodeURIComponent('星月网吧'),
            method: "GET",
        }
        console.log(options);
       var result = await  getData(options,key);
       ctx.body=result
    });

    function getData(options,key) {
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
}
