module.exports = function ($) {

    //用户列表
    $.get("/users", async (ctx, next) => {
        var self = ctx;
        let config = global.config;
        //将session放入ejs渲染数据中
        self.state.session = self.session;

        //admin 角色才可访问
        if (!self.session.user || !(self.session.user_type == 'admin')) {
            self.redirect('/login');
            return;
        }

        var _params = self.request.query;
        var offset = _params.offset ? _params.offset : 0;
        var limit = _params.limit ? _params.limit : config.get("limit");

        var result = {};
        var status = 200;
        var params = {};

        var username = _params["username"] ? _params["username"] : "";
        if (username != '') {
            params.username = new RegExp(username, 'i');
            ;
        }

        var company = _params["company"] ? _params["company"] : "";
        if (company != '') {
            params.company = new RegExp(company, 'i');
        }

        var user_group = _params["user_group"] && _params["user_group"] != "all" ? _params["user_group"] : "";
        if (user_group != '') {
            params.user_group = new RegExp(user_group, 'i');
        }
        var role = _params["role"] && _params["role"] != "all" ? _params["role"] : "";
        params['$or']=[{trial:{$exists:false}},{trial:1},{trial:0,status:{"$nin": [0, 2]}}]

      //  params['status']={"$nin": [0, 2]};
        if (role != '') {
            params.role = new RegExp(role, 'i');
        }

        var userModel = self.model("user");
        var userGroupModel = self.model("user_group");
        var roleModel = self.model("user_role");

        var totalPage = 0;
        var count = await userModel.getRowsCount(params);
        if (count) {
            totalPage = Math.ceil(count / limit);
        }

        var rows = await userModel.getPagedRows(params, offset, limit, {
            created: -1
        });

        if (rows) {
            result = {
                rows: rows,
                user_group: user_group,
                username: username,
                company: company,
                role: role,
                offset: offset,
                limit: limit,
                totalPage: totalPage,
                // cors_host:config.get('cors_host')
            };
        } else {
            status = 400;
        }

        //获取客户标签
        var groups = await userGroupModel.getRows({});
        if (groups) {
            result.groups = groups;
        } else {
            result.groups = [];
        }

        //获取角色
        var roles = await roleModel.getRows({});
        if (roles) {
            result.roles = roles;
        } else {
            result.roles = [];
        }
        var common = self.library("common");
        result.common = common;
        result.title = '客户列表';
        await self.render('users/users', result);
    });

    //创建用户
    $.post("/users", async (ctx, next) => {
        var self = ctx;
        var _params = self.request.fields;
        console.log(_params);
        var status = 201;
        var result = {};
        //创建
        var userModel = self.model("user");
        var user = await userModel.getRow({
            username: _params.username,
        });

        var user2 = await userModel.getRow({
            email: _params.email
        });

        var user3 = await userModel.getRow({
            mobile: _params.mobile
        });

        if (user) {
            status = 400;
            result = "用户名已经存在！";
        } else if (user2){
            status = 400;
            result = "注册邮箱已经存在！";
        }else if (user3){
            status = 400;
            result = "手机号已经存在！";
        } else {
            //生成 APP_KEY APP_SECRET
            var uuid = require('uuidjs');
            var app_key = uuid.genV4();
            var app_secret = uuid.genV4();
            _params.app_key = app_key;
            _params.app_secret = app_secret;
            _params.trial = 1;
            _params.status = 1;

            var user = await userModel.createRow(_params);
            if (user) {
                status = 201;
                sendEmail (ctx, user.email,user.company,user.username,'666666')

            } else {
                result = "创建失败!";
                status = 400;
            }
        }
        self.status = status;
        self.body = result;
    });

    //编辑用户
    $.put("/users/:_id", async (ctx, next) => {
        var self = ctx;
        var _id = self.params._id;
        var _params = self.request.fields;

        var status = 201;
        var result = {};

        var userModel = self.model("user");
        var user = await userModel.getRow({
            username: _params.username,
            _id: {
                $ne: _id
            }
        });

        if (user) {
            status = 400;
            result = "用户名已经存在！";
        } else {
            //生成 APP_KEY APP_SECRET
            var uuid = require('uuidjs');
            var app_key = uuid.genV4();
            var app_secret = uuid.genV4();

            let rows = await  userModel.getRow({
                _id: _id
            });
            if (rows){
                if (!rows.app_key){
                    _params.app_key = app_key;
                }
                if (!rows.app_secret){
                    _params.app_secret = app_secret;
                }
            }else {
                result = "更新失败!";
                status = 400;
            }
            var isSuccess = await userModel.findOneAndUpdateRow({
                _id: _id
            }, _params);

            if (isSuccess) {
                status = 201;
            } else {
                result = "更新失败!";
                status = 400;
            }
        }

        self.status = status;
        self.body = result;
    });

    //用户信息
    $.get("/users/:_id", async (ctx, next) => {
        var self = ctx;
        var _id = self.params._id;

        var status = 200;
        var result = {};
        var userModel = self.model("user");
        var user = await userModel.getRow({
            _id: _id
        });
        if (user) {
            status = 200;
            result = user;
        } else {
            status = 404;
        }
        self.status = status;
        self.body = result;
    });

    //删除用户
    $.delete("/users/:_id", async (ctx, next) => {
        var self = ctx;
        var result = {};

        var _id = self.params._id;

        var userModel = self.model("user");
        var isSuccess = await userModel.deleteRow({
            _id: _id
        });

        if (isSuccess) {
            status = 201;
        } else {
            result = "操作失败!";
            status = 400;
        }

        self.status = status;
        self.body = result;
    });

    // 初始化用户密码
    $.put("/users/init/password/:id", async (ctx, next) => {
        var self = ctx;

        //将session放入ejs渲染数据中
        self.state.session = self.session;

        //admin 角色才可访问
        if (!self.session.user || !(self.session.user_type == 'admin')) {
            self.redirect('/login');
            return;
        }

        var id = self.params.id;

        var status = 200;
        var result = {};
        var crypto = require('crypto');
        var md5 = crypto.createHash('md5');
        md5.update('666666', 'utf8');
        var password = md5.digest('hex');

        var userModel = self.model("user");
        var isSuccess = await userModel.findOneAndUpdateRow({
            _id: id
        }, {
            "password": password
        });
        if (isSuccess) {
            result = {
                "code": "20000",
                "msg": "密码初始化成功,默认密码666666，请尽快修改初始密码！"
            }
        } else {
            status = 400;
            result = {
                "code": "20001",
                "msg": "密码初始化失败"
            }
        }

        self.status = status;
        self.body = result;
    });

    //个人设置
    $.get("/users/setting", async (ctx, next) => {
        var self = ctx;

        //将session放入ejs渲染数据中
        self.state.session = self.session;

        var params = {};
        var result = {};
        var status = 200;

        result.title = '个人设置';
        await self.render('/users/setting', result);
    });

    //查询可用余额
    $.get("/users/banlance/:_id", async (ctx, next) => {
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
    var sendEmail = function (ctx, emailIp,companyName,userName,passWrod) {
        var html1 = '<div style="background: url(\'http://images.uniccat.com/HMC151503610879590876864163\') no-repeat;width: 100%;height: auto;-webkit-background-size:cover ;background-size:cover ;box-sizing: border-box;overflow: hidden;";>\n' +
            '<div style="background-color: #fff;margin: 80px auto 20px;box-shadow:inset 0px -3px 0px 0px rgba(53,55,66,0.24);border-radius:4px;background-image: url(\'http://images.uniccat.com/HMC151503617078844045983176\');background-repeat: no-repeat;background-size: 128px;background-position: 50% 20px;box-sizing: border-box;overflow: hidden;width: 600px;height: 80%;min-height: 440px;">\n' +
            '    <div style="width: 100%;height: auto;min-height: 200px;background-color: #f4f5f7;box-sizing: border-box;margin-top: 24%;">\n' +
            '        <p style="padding-left: 40px;padding-top: 20px;color:#57595f;box-sizing: border-box">\n' +
            '          尊敬的用户：\n' +
            '        </p>\n' +
            '        <p style="padding-left: 40px;padding-right: 40px;padding-bottom: 20px;color:#57595f;padding-top: 30px;box-sizing: border-box">\n' +
            '          您好！<br/>' +
            '          恭喜您已成为黑猫察用户！<br/>' +
            '          您的签约信息如下：<br/>' +
            '         【企业名称】：'+companyName+'<br/>' +
            '         【用户名】：'+userName+'<br/>' +
            '          您现在可以登录黑猫察：<br/>' +
            '          登录地址：https://uniccat.com<br/>' +
            '          登录名：'+userName+'<br/>' +
            '          初始密码：'+passWrod+'' +
            '          您可以通过完善企业及个人信息，再次申请黑猫察试用账号<br/>' +
            '          登录黑猫察后，请您马上修改登录密码，保障账户安全！<br/>' +
            '          特别提示：<br/>' +
            '          感谢您的对黑猫察的信赖和支持！<br/>' +
            '          账户开通之后，如遇使用问题，请尽快联系您的客户经理，我司将根据协议中约定为您提供服务。<br/>' +
            '          祝您工作愉快！<br/>' +
            '          为保障账户安全，贵司提供的邮箱为唯一认定服务信息发送渠道。如联系人或邮箱等用户信息有更改，请尽快联系我司。<br/>' +
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
        var params2 = {
            'from': "cycredit@sUgS9yPWVU62ZzBtECIvgFI2GYvy4GXx.sendcloud.org",
            'to': emailIp,
            'subject': '您的黑猫察申请结果提醒',
            'html': html1,
            'respEmailId': 'true',
            'fromName': ' 中青信用管理有限公司  运营部'
        }
        var email = ctx.library('email')
        email.sendCloudEmail(params2)
    }

};
