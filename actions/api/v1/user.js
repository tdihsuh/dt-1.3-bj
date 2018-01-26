module.exports = function ($) {
    var crypto = require('crypto');
    var uuid = require('uuidjs');
    var config = require('config');
    var request = require("request");
    var WXPay = require('weixin-pay');
    var moment = require("moment");
    const path = require('path');
    const fs = require('fs')
    const Alipay = require('alipay-mobile')
    const read = filename => {
        return fs.readFileSync(path.resolve(__dirname, filename))
    }
    //app_id: 开放平台 appid
    //appPrivKeyFile: 你的应用私钥
    //alipayPubKeyFile: 蚂蚁金服公钥
    const options = {
        app_id: '2016080200153032',
        appPrivKeyFile: read('./alipay_private.pem'),
        alipayPubKeyFile: read('./alipay_public.pem'),
    }
    const service = new Alipay(options)
    // 找回密码-验证邮箱
    $.get('/api/v1/users/emails/:email', async (ctx, next) => {
        var self = ctx;
        var email = self.params.email
        var status = 200
        var result = {}
        var userModel = self.model('user')
        var row = await userModel.getRow({
            email : email
        });
        if (row) {
            result = true;
        } else {
            status = 400
            result = false
        }
        self.status = status
        self.body = result
    })

    // 找回密码-图形验证码校验
    $.get('/api/v1/users/codes/:code', async (ctx, next) => {
        var self = ctx;
        var _params = self.request.query;
        var svg_code = self.params.code.toLowerCase();
        var captacha = self.session.captcha.toLowerCase();

        var status = 200
        var result = {}

        if (svg_code == captacha){
            self.session.captcha = '';
            result = true;
        } else {
            status = 400;
            result = '图形验证码错误，请重新输入';
            self.session.captcha = '';
        }
        self.status = status
        self.body = result
    })

    // 找回密码-发送邮件
    $.get('/api/v1/users/auth/:email', async (ctx, next) => {
        var self = ctx;
        var status = 200;
        var _params = self.request.query;
        var result = {};
        var email = self.params.email;

        // 生成时间戳
        var timestamp = Date.now();
        // 拼接域名
        var host = config.host +'/api/v1/users/urls/vertify?';
        //生成secret字符串
        var secret = uuid.genV4();

        var query = {
            email : email,
            timestamp: timestamp,
            secret: secret
        }

        var signature = await dySign(query);
        var parmas = 'email='+''+email+''+'&'+'stamp='+''+timestamp+''+'&'+'sign='+''+signature+''+'&'+'secret='+''+secret+'';

        //是否有找回记录，有找回记录-更新验签，没有记录-新增一条记录
        var findlogModel = self.model('user_findlog');
        var row = await findlogModel.findOneAndUpdateRow({
            email : email
        },{
            sign      : signature,
            timestamp : timestamp,
            secret    : secret,
            find_lose : 1
        });

        if (!row){
            var row = await findlogModel.createRow({
                sign      : signature,
                email     : email,
                timestamp : timestamp,
                secret    : secret,
                find_lose : 1
            });
        }

        //创建邮件模板
        var obj = {
            emailip : email,
            msg : encodeURI(''+host+''+ ''+parmas+'')
        }
        var html = await email_credit(obj);
        var params2 = {
            'from': "cycredit@sUgS9yPWVU62ZzBtECIvgFI2GYvy4GXx.sendcloud.org",
            'to': email,
            'subject': '【黑猫察】忘记密码 - 用户身份确认',
            'html': html,
            'respEmailId': 'true',
            'fromName': ' 中青信用管理有限公司  运营部'
        }
        //发送邮件
        var email = self.library('email')
        var row = await email.sendCloudEmail(params2)
        if(row){
            status = 200;
            result = row;
        }else {
            result = row;
        }
        self.status = status;
        self.body = result;
    })

    // 找回密码-连接校验
    $.get('/api/v1/users/urls/vertify', async (ctx, next) => {
        var self = ctx;
        var status = 200;
        var _params = self.request.query;
        var email = _params.email? _params.email : '';
        var timestamp = _params.stamp? _params.stamp : '';
        var sign = _params.sign? _params.sign : '';

        // 生成时间戳
        var endtimestamp = Date.now();

        //查询是否是当前邮箱，并且找回状态不失效
        var findlogModel = self.model('user_findlog');
        var row = await findlogModel.getRow({
            email : email,
            find_lose : 1
        });

        if (row){
            if (Math.round(endtimestamp/ 1000)> Math.round(timestamp/ 1000) + 3600){
                console.log('重新获取');
                self.status = 400;
                self.body = "重新获取";
            }else {
                console.log('继续验证');
                // -----------校验验证连接是否有效
                // 生成secret字符串
                var secret = row.secret;
                var query = {
                    email : email,
                    timestamp: timestamp,
                    secret: secret
                }
                var signature = await dySign(query);

                if (sign == signature){
                    var host = config.host +'/forget/step3?';
                    let params = 'email='+''+email+''+'&'+ 'secret='+''+secret+''
                    let host_url = host +params;
                    self.redirect(host_url);
                }else {
                    console.log('验证失败,请重试');
                    var host = config.host +'/forget/step1?';
                    let host_url = host;
                    self.redirect(host_url);
                }
            }
        }else {
            self.status = 400;
            self.body = "验证失败，请重新获取";
        }
    })

    // 找回密码-重置密码
    $.put('/api/v1/users/reset/:email', async (ctx, next) => {
        var self = ctx;
        var _params = self.request.fields;
        var email = self.params.email;
        var password = _params.password ? _params.password : '';
        var secret = _params.secret ? _params.secret : '';
        var status = 200
        var result = {}
        var userModel = self.model('user');
        var findlogModel = self.model('user_findlog');
        var isSuccess = await findlogModel.getRow({
            email : email,
            find_lose : 1
        });
        if (!isSuccess){
            status = 400
            result = "对不起，出错了";
            return;
        }

        if (secret == isSuccess.secret){
            var row = await userModel.findOneAndUpdateRow({
                email : email
            },{
                'password': password
            });
            if (row) {
                result = true;
                isSuccess = await findlogModel.updateRow({
                    email : email,
                    find_lose : 1
                },{
                    find_lose : 0
                })
            } else {
                status = 400
                result = false
            }
        }else {
            status = 400
            result = "对不起，出错了";
        }
        self.status = status
        self.body = result
    })

    // 修改密码
    $.put('/api/v1/users/:id', async (ctx, next) => {
        var self = ctx;
        var id = self.params.id
        var password = self.request.fields.password
        var status = 200
        var result = {}
        var userModel = self.model('user')
        var isSuccess = await userModel.findOneAndUpdateRow({
            _id: id
        }, {
            'password': password
        });

        if (isSuccess) {
            result = {
                '-': '20000',
                'msg': '密码修改成功'
            }
        } else {
            status = 400
            result = {
                'code': '20001',
                'msg': '密码修改失败'
            }
        }

        self.status = status
        self.body = result
    })

    //微信授权
    $.get('/api/v1/wechat/login', async (ctx, next) => {
        let self = ctx;
        let status = 200;
        let result = {};
        let open_id = '';
        let _params = self.request.query;
        let obj = {
            appid : 'wxe781a27bbf93e26c',
            secret :'50a583565c64fb65d7958f834273c942',
            js_code : _params.code,
            grant_type: 'authorization_code'
        };
        let wechat = self.library('wechat')
        let row = await wechat.wechat_res(obj);
        if(row){
            status = 200;
            open_id = JSON.parse(row).openid;
        }

        var userModel = self.model("user");
        let user_row = await userModel.getRow({
            username : open_id
        });
        //检查用户是否已经存在
        if (user_row){
            //已存在用户直接登录
            let login_params = {
                username    : open_id,
                password    : '666666',
            }
            //调用登录接口
            let login = await wechat.wechat_user_login(login_params);
            if (login){
                //调用查询授权信息接口
                let apply_params = {
                    user_id    : JSON.parse(login)._id,
                }
                let apply = await wechat.wechat_user_apply(apply_params);
                result = {
                    apply : JSON.parse(apply),
                    user : JSON.parse(login)
                };
            }
        }else {
            //未注册用户，先创建用户，再执行自动登录
            let user_params = {
                apis            : '企业查询',
                username        : open_id,
                role            : 'role_formal',
                weixin          : open_id,
                password        : '666666',
            }
            /*为小程序用户创建账户*/
            let creatUser = await wechat.wechat_creat_user(user_params);
            if (creatUser){
                //创建用户完成，获取用户列表
                var userModel = self.model("user");
                var users = await userModel.getRow({
                    username : open_id
                });
                if (users) {
                    //获取API列表
                    let wx_api = users.apis;
                    let user_id = users.id;
                    let apiModel = self.model("api");
                    let apis_row = await apiModel.getRow({
                        name : wx_api
                    });

                    if (apis_row) {
                        console.log(apis_row);
                        //调用api授权接口
                        let api_id = apis_row._id;
                        console.log(api_id);
                        let api_query = {
                            user_id : user_id,
                            api_id  : ''+api_id+''
                        }
                        let weixin_api = await wechat.wechat_api_apply(api_query);
                        if (weixin_api){
                            //调用登录接口
                            let login_params = {
                                username    : open_id,
                                password    : '666666',
                            }
                            let login = await wechat.wechat_user_login(login_params);
                            if (login){
                                //调用查询用户授权信息接口
                                let apply_params = {
                                    user_id    : JSON.parse(login)._id,
                                }
                                let apply = await wechat.wechat_user_apply(apply_params);
                                result = {
                                    apply : JSON.parse(apply),
                                    user : JSON.parse(login)
                                };
                            }
                        }
                    }else {
                        status = 400;
                    }
                }else {
                    status = 400;
                }
            }
        }
        self.status = status;
        self.body = result;
    })

    //登录
    $.get('/api/v1/login', async (ctx, next) => {
        var self = ctx;
        var _params = self.request.query;
        if (self.validate(_params, {
                userName: 'required',
                password: 'required'
            }).length !== 0) {
            self.status = 400;
            self.body = '参数有误';
            return
        }
        var userModel = self.model('user');
        var userName = _params['userName'];
        var password = _params['password'];
        var params = {
            username: userName,
            password: password
        };

        var row = await userModel.getRow(params);
        if (row) {
            self.status = 201
            self.session.user = row
            self.body = row
        } else {
            self.status = 400
            self.body = {}
        }
        console.log(row);

    })

    //获取用户API授权信息
    $.get("/api/v1/users/:_id/apis", async (ctx, next) => {
        var self = ctx;
        var user_id = self.params._id;
        var params = {
            user_id: user_id
        };
        var result = {}
        //获取授权列表
        var applies = []
        var apiApplyModel = self.model("api_apply");
        var rows = await apiApplyModel.getFilteredRows(params, {}, '-__v -created -user_id');
        if (rows) {
            for (var i in rows) {
                applies.push(rows[i].toObject());

                var api_id = applies[i]['api_id'];
                var apiModel = self.model("api");
                var api = await apiModel.getFilteredRow({
                    _id: api_id
                }, '-_id name uri category');

                if (api) {
                    applies[i].api = api;
                }
            }
        } else {
            status = 400;
        }

        self.body = applies;
    });

    //账户类型分组
    $.get('/api/v1/user_group', async (ctx, next) => {
        var self = ctx;
        var _params = self.request.query;
        var status = 201;
        var result = {};
        var groupModel = self.model("user_group");
        var group = await groupModel.getRows({});
        if (group){
            status = 201;
            result = group;
        }else {
            status = 400;
        }
        self.status = status;
        self.body = result;
    });

    //试用申请
    $.post('/api/v1/users/:telcode', async (ctx, next) => {
        var self = ctx;
        var _params = self.request.fields;
        let sms_code = self.params.telcode;
        var status = 201;
        var result = {};
        var over = Math.round(Date.now() / 1000);//获取当前时间戳
        var query = {};

        //创建
        var userModel = self.model("user");
        var user = await userModel.getRow({
            mobile: _params.mobile
        });

        var user2 = await userModel.getRow({
            email: _params.email
        });

        if (user && user.status != 2) {
            status = 400;
            result = "手机号码已经存在！";
            return;
        }

        if (user2 && user2.status != 2) {
            status = 400;
            result = "注册邮箱已经存在！";
            return;
        }

        //短信验证码是否校验正确
        if (!(sms_code == self.session.client_data)){
            result = "验证码错误，请重新输入";
            status = 400;
        }else {
            //短信验证码是否超过10分钟有效时间
            if (over > self.session.overtime){
                status = 400;
                result = "验证码超时，请重新获取短信验证码";
            }else {
                //生成 APP_KEY APP_SECRET
                var uuid = require('uuidjs');
                var app_key = uuid.genV4();
                var app_secret = uuid.genV4();

                query = {
                    app_key         : app_key,
                    app_secret      : app_secret,
                    apis            : _params.apis,
                    username        : _params.email,
                    user_group      : _params.user_group,
                    mobile          : _params.mobile,
                    email           : _params.email,
                    status          : _params.status,
                    trial           : _params.trial,
                    uniform         : _params.uniform,
                    photo_url       : _params.photo_url,
                    identity_code   : _params.identity_code,
                    company         : _params.company,
                    contact_name    : _params.username,
                }

                if (user&&user.status == 2){
                   // console.log('1231');
                    var row = await userModel.findOneAndUpdateRow({
                        mobile          : _params.mobile,
                        email           : _params.email
                    },query);
                    if (row) {
                        status = 201;
                    } else {
                        result = "创建失败!";
                        status = 400;
                    }
                }else {
                    var user = await userModel.createRow(query);
                    if (user) {
                        status = 201;
                    } else {
                        result = "创建失败!";
                        status = 400;
                    }
                }
            }
        }
        self.status = status;
        self.body = result;
    });

    // 用户查询日志
    $.get("/api/v1/users/:user_id/consumptions", async (ctx, next) => {
        var self = ctx;
        var result = {};
        var status = 200;
        var _params = self.request.query;
        var offset = _params.offset ? _params.offset : 0;
        var user_id = self.params.user_id;
        var limit = _params.limit ? _params.limit : config.get("limit");
        var sort = _params.sort ? _params.sort : 1;
        var query_status = _params.query_status ? Number(_params.query_status) : 2;
        var query_type = _params.query_type ? Number(_params.query_type) : 2;
        var start_date = _params.start_date ? _params.start_date : 0;
        start_date = parseInt(start_date);
        var end_date = _params.end_date ? _params.end_date : 0;
        end_date = parseInt(end_date);
        var total;
        var params;
        if (query_type == 2) {
            if (query_status == 2) {
                params = {
                    user_id: user_id,
                    created: {"$gte": start_date, "$lte": end_date}
                }
            } else {
                params = {
                    user_id: user_id,
                    created: {"$gte": start_date, "$lte": end_date},
                    'queries.query_status': query_status,
                }
            }
        } else {
            if (query_status == 2) {
                params = {
                    user_id: user_id,
                    created: {"$gte": start_date, "$lte": end_date},
                    'queries.query_type': query_type,
                }
            } else {
                params = {
                    user_id: user_id,
                    created: {"$gte": start_date, "$lte": end_date},
                    'queries.query_type': query_type,
                    'queries.query_status': query_status,
                }
            }
        }

        var queryMode = self.model("query_log");
        var row = await  queryMode.getRows(params);
        if (row.length > 0) {
            total = row.length;
            var rows = await queryMode.getFilteredPagedRows(params, offset, limit, {
                created: sort
            }, 'queries created');
            if (rows.length > 0) {
                status = 200;
                result = {
                    totalPage: total,
                    rows: rows,
                    limit: limit,
                    offset: offset
                }
            } else {
                status = 400;
            }
        } else {
            status = 400;
        }
        self.status = status;
        self.body = result;
    });

    //查询可用余额
    $.get("/api/v1/users/banlance/:_id", async (ctx, next) => {
        var self = ctx;
        var result = {};
        var _id = self.params._id;
        let status = 200;
        let userModel = self.model("user");
        var user = await userModel.getRow({
            _id: _id
        });
        if (user) {
            status = 200;
            result = user;
        } else {
            status = 400;
        }

        self.status = status;
        self.body = result;
    });

    //获取微信二维码，微信支付
    $.get("/api/v1/weixin/creat_code", async (ctx, next) => {
        var self = ctx;
        var status = 200;
        let _params = self.request.query;
        let money = _params.money ? _params.money : 1;
        var wxpay = WXPay({
            appid: config.weixinpay.appid,
            mch_id: config.weixinpay.mch_id,
            partner_key: config.weixinpay.partner_key, //微信商户平台API密钥
            pfx: require('fs').readFileSync('./libraries/wechat/apiclient_cert.p12'), //微信商户平台证书
        });

        //生成商户订单号时间
        let day = moment().format("YYYYMMDD");
        //随机产生六位数验证码
        var range = function (start, end) {
            var array = [];
            for (var i = start; i < end; ++i) array.push(i);
            return array;
        };
        var randomNum = range(0, 6).map(function (x) {
            return Math.floor(Math.random() * 10);
        }).join('');

        var host = config.host +'/forget/step3?';
        let params = 'email='+''+email+''+'&'+ 'secret='+''+secret+''
        let host_url = host +params;
        self.redirect(host_url);

        var row = await new Promise(function(resovle,reject){
            wxpay.createUnifiedOrder({
                body: '扫码支付',
                out_trade_no: day + Math.random().toString().substr(2, 10),//输出订单号
                total_fee: money,//支付金额
                spbill_create_ip: '',//ip
                notify_url: config.host + '/api/v1/weixin/callback',//回调地址
                trade_type: 'NATIVE',//类型
                product_id: randomNum//二维码ID
            }, async function(err, result){
                if (!err){
                    status = 200;
                    return resovle(result);
                }else {
                    status = 400;
                    return resovle(err);
                }
            });
        });
        self.status = status;
        self.body = row;
    });

    //微信支付回调
    $.get("/api/v1/weixin/callback", async (ctx, next) => {
        var self = ctx;
        let status = 200;
        var wxpay = WXPay({
            appid: 'wx9036661cba762c8e',
            mch_id: '1469642202',
            partner_key: 'CHINAYOUTHCREDITzhongqingxinyong', //微信商户平台API密钥
            pfx: require('fs').readFileSync('./libraries/wechat/apiclient_cert.p12'), //微信商户平台证书
        });

        var row = await new Promise(function(resovle,reject){
            wxpay.useWXCallback(function(msg, req, res, next){
                // msg: 微信回调发送的数据
                console.log(msg);
                console.log(req);
                console.log(res);
                res.success();
            });
        });

        self.status = status;
        self.body = row;
    });

    //支付宝支付
    $.get("/api/v1/alipay/creat_code", async (ctx, next) => {
        var self = ctx;
        let status = 200;
        var outTradeId = Date.now().toString();
        let _params = self.request.query;
        let money = _params.money ? _params.money : 1;

        const data = {
            subject: '中青信用管理有限公司',
            out_trade_no: outTradeId,
            total_amount: ''+money+''
        }
        const basicParams = {
            return_url: 'http://localhost:3000/api/v1/alipay/callback'
        }
        return service.createPageOrderURL(data, basicParams)
            .then(result => {
                console.log(result.code == 0, result.message)
                console.log(result);
                self.body = result;
                self.status = status;

            });
    });

    //支付宝支付回调
    $.post("/api/v1/alipay/callback", async (ctx, next) => {
        var self = ctx;
        let status = 200;
        var _params = self.request.fields;
        // var _params = self.request.query;

        // const params = {
        //     memo: "xxxx",
        //     result: "xxxx",
        //     resultStatus: "xxx"
        // }
        // return service.verifyPayment(params)

        const params = {
            app_id : _params.app_id,
            sign: _params.sign,
            sign_type: _params.sign_type,
            notify_time : _params.notify_time,
            auth_app_id : _params.auth_app_id,
            notify_type : _params.notify_type,
            notify_id : _params.notify_id,
            version : _params.version,
            trade_no : _params.trade_no,
            out_trade_no : _params.out_trade_no
        }

        return service.makeNotifyResponse(params)
            .then(result => {
           console.log(result);
        })
        //
        // const params = {
        //     out_trade_no: outTradeId
        // }
        // return service.tradeClose(params)

        self.status = status;
        self.body = {};
    });

    //加密规则，把所有参数按首字母排序，去掉引号和等号，拼接成字符串，使用md5生成签名
    function dySign (obj) {
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

    //发送邮件
    function email_credit (params) {
        var html1 = '<div style="background: url(\'http://images.uniccat.com/HMC151503610879590876864163\') no-repeat;width: 100%;height: auto;-webkit-background-size:cover ;background-size:cover ;box-sizing: border-box;overflow: hidden;";>\n' +
            '<div style="background-color: #fff;margin: 80px auto 20px;box-shadow:inset 0px -3px 0px 0px rgba(53,55,66,0.24);border-radius:4px;background-image: url(\'http://images.uniccat.com/HMC151503617078844045983176\');background-repeat: no-repeat;background-size: 128px;background-position: 50% 20px;box-sizing: border-box;overflow: hidden;width: 600px;height: 80%;min-height: 440px;">\n' +
            '    <div style="width: 100%;height: auto;min-height: 200px;background-color: #f4f5f7;box-sizing: border-box;margin-top: 24%;">\n' +
            '        <p style="padding-left: 40px;padding-top: 20px;color:#57595f;box-sizing: border-box">\n' +
            '       尊敬的用户:\n' +
            '        </p>\n' +
            '        <p style="padding-left: 40px;padding-right: 40px;padding-bottom: 20px;color:#57595f;padding-top: 30px;box-sizing: border-box">\n' +
            '           您好！<br/>' +
            '           您申请修改登录密码，请在24小时内完成设置。如果未作任何操作，系统将保留原密码<br/>' +
            ' <br/>' +
            ' <br/>' +
            '<a style="color:red" href="'+params.msg+'">立即修改登录密码</a><br/>' +
            ' <br/>' +
            '           如果点击无效，请复制下方页面地址到浏览器地址栏中打开<br/>' +
            '          '+params.msg+'<br/>' +
            '<br/>' +

            '        </p>\n' +
            '    </div>\n' +
            '    <p style="padding-left: 40px;padding-top: 10px;color:#57595f;box-sizing: border-box">\n' +
            '        黑猫察\n' +
            '        <br>\n' +
            '        ----\n' +
            '        <br>\n' +
            '        中青信用管理有限公司 运营部\n' +
            '    </p>\n' +
            '</div>\n' +
            '<div style="width: 100%;font-size:14px;color:#ffffff;line-height:22px;text-align:center;margin-bottom: 20px;">\n' +
            '    © 2018 <span style="font-size:14px;color:#7fbbf6;line-height:22px;">中青信用</span> . All Rights Reserved.\n' +
            '</div>\n' +
            '\n' +
            '</div>'

       return html1
    };
}
