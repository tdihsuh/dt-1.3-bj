module.exports = function($) {
    //七牛上传凭证
    $.get('/api/v1/qiniu/token/:key', async (ctx, next) => {
        var qi_niu = require('qiniu');
        var self = ctx;
        var result = {};
        var _params = self.request.query;
        var key = self.params.key;
        var status = 200;
        //需要填写你的 Access Key 和 Secret Key
        var accessKey = 'HyiV7hZ6-vH0ZSyEubxYAhXPyLFb-aJ4Q2ukz_4l';
        var secretKey = 'rrqgLZCgI8ql60iMaGK055jdDTtfknpwI48zaWTF';
        qi_niu.conf.ACCESS_KEY = accessKey;
        qi_niu.conf.SECRET_KEY = secretKey;

        //要上传的空间
        var bucket = 'blackcat';
        console.log(key);
        //构建上传策略函数
        function uptoken(bucket, key) {
            var putPolicy = new qi_niu.rs.PutPolicy(bucket + ":" + key);
            return putPolicy.token();
        }
        //生成上传 Token
        var token = uptoken(bucket, key);

        if (token) {
            status = 200;
            result = token;
        } else {
            status = 400;
        }
        self.status = status;
        self.body = result;
    });

    //图形验证码
    $.get("/api/v1/svg", async (ctx, next) => {
        var svgCaptcha = require("svg-captcha");
        var self = ctx;
        // 验证码，对了有两个属性，text是字符，data是svg代码
        var captcha = svgCaptcha.create({
            color: true,
            // 翻转颜色
            inverse: true,
            // 字体大小
            fontSize: 40,
            // 噪声线条数
            noise: 1,
            // 宽度
            width: 85,
            // 高度
            height: 40,
        });
        self.session.captcha = captcha.text;
        self.status = 200;
        self.body = captcha.data;
        console.log(captcha.data);
    });

    //手机号码是否存在
    $.get("/api/v1/mobile/:mobile", async (ctx, next) => {
        let self = ctx;
        let result = {};
        let status = 200;
        let _params = self.request.query;
        let mobile = self.params.mobile;
        let userModel = self.model('user');
        let row = await userModel.getFilteredRow({
            mobile : mobile
        },'status');
        if (row){
            result = row;
        }else {
            status = 400;
            result = false;
        }
        self.status = status;
        self.body = result;
    });

    //短信验证码通道.传参图形验证码
    $.get('/api/v1/sms/:mobile', async (ctx, next) => {
        var self = ctx;
        var result = {};
        var status = 200;
        var _params = self.request.query;
        var phone = self.params.mobile;
        var img_Code = _params.code? _params.code.toLowerCase():0;
        var sms_code = 'SMS_122283017';

        var captacha = self.session.captcha.toLowerCase();
        //验证图形验证码是否符合要求
        if (captacha == img_Code) {
            //随机产生六位数验证码
            var range = function (start, end) {
                var array = [];
                for (var i = start; i < end; ++i) array.push(i);
                return array;
            };
            var randomNum = range(0, 6).map(function (x) {
                return Math.floor(Math.random() * 10);
            }).join('');

            // 生成时间戳
            var t1 = Math.round(Date.now() / 1000);

            //时间戳保存验证码失效时间，10分钟后提示验证码失效重新获取
            var over = Math.round(Date.now() / 1000);

            //请求参数
            var params = {
                TemplateCode: sms_code,
                PhoneNumbers: '' + phone + '',
                timestamp: '' + t1 + '',
                TemplateParam: '{"code":"' + randomNum + '"}',
                SignName : '黑猫察'
            }

            //是否存在验证码超时时间戳,存在直接判断，不存在添加并执行一次短信获取
            if (self.session.timestamp){
                //判断时间戳，是否大于60秒计时
                if (t1 > self.session.timestamp) {
                    self.session.timestamp = t1 + 60;//短信验证码再次可发送时间
                    self.session.overtime = over + 600;//短信验证码可用时长
                    self.session.captcha = '';//清空图形验证码，再次发送短信需重新获取
                    var sms = self.library("sms");
                    var row = await sms.smsResult(params);
                    if (row) {
                        if (row.Code === 'OK'){
                            result = row;
                            status = 201;
                            self.session.client_data = randomNum;//存储短信验证码
                        }else {
                            self.status = 500;
                            self.body = row;
                            return;
                        }
                    }
                } else {
                    status = 400;
                    result = '请60秒后重新获取';
                }
            }else {
                self.session.timestamp = t1 + 60;
                self.session.overtime = over + 600;
                self.session.captcha = '';
                var sms = self.library("sms");
                var row = await sms.smsResult(params);
                if (row) {
                    if (row.Code === 'OK'){
                        result = row;
                        status = 201;
                        self.session.client_data = randomNum;//存储短信验证码
                    }else {
                        self.status = 500;
                        self.body = row;
                        return;
                    }
                }
            }
        }else {
            status = 400;
            self.session.captcha = '';//清空图形验证码，再次发送短信需重新获取
            result = '图形验证码错误';
        }
        self.status = status;
        self.body = result;

    });
};