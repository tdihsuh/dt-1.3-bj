module.exports = function ($) {
    //试用账号查询
    $.get("/trial_account", async (ctx, next) => {
        var self = ctx;
        //admin 角色才可访问
        if (!self.session.user || !(self.session.user_type == 'admin')) {
            self.redirect('/login');
            return;
        }
        //参数包括 user_id  开始时间 结束时间
        var _params = self.request.query;
        var offset = _params.offset ? _params.offset : 0;
        var limit = _params.limit ? _params.limit : config.get("limit");
        var result = {};
        var from = _params.from;
        var to = _params.to;
        start_date = from ? Date.parse(new Date(from)) : '';
        end_date = to ? (Date.parse(new Date(to)) + 86400000) : ''; //加上1天的毫秒数
        var status = parseInt(_params.status);
        var keyword = _params.keyword
        var params = {};
        params['trial'] = 0;
        if (keyword && keyword !== 'undefined') {
            params['company'] = eval("/" + keyword + "/i");
        }
        if (start_date && end_date) {
            params['created'] = {"$gte": start_date, "$lte": parseInt(end_date)};
        }
        if ((status && status != 3)||status==0) {
            params['status'] = status;
        }
        var trialModel = self.model('user');
        //总数量
        var totalPage = 0;
        var count = await trialModel.getRowsCount(params);
        if (count) {
            totalPage = Math.ceil(count / limit);
        }
        console.log(params);
        var rows = await trialModel.getPagedRows(params, offset, limit, {
            'status': 1,
            'created': -1
        });
        //添加企业标签
        var user_group = self.model('user_group');
        if (rows) {

            for (var i = 0; i < rows.length; i++) {

                var group_id = rows[i]['user_group']
                if (containChina(group_id)) {
                    continue
                }
                group_row = await   user_group.getRow({'_id': group_id})
                if (group_row && group_row.description) {
                    rows[i]['group_name'] = group_row['description']
                } else {
                    rows[i]['group_name'] = ''
                }

            }
        }

        result = {
            rows: rows,
            offset: offset,
            limit: limit,
            totalPage: totalPage,
            status: status,
            startDateFormat: from,
            endDateFormat: to

        };


        if (keyword == "undefined") {
            result['keyword'] = '';
        } else {
            result['keyword'] = keyword;
        }

        var common = self.library("common");
        result.common = common;
        result.title = '试用账号申请';
        await self.render('account/trial_account', result);

    });

    function containChina(value) {
        if (/.*[\u4e00-\u9fa5]+.*$/.test(value) || /^[1-9]\d*$|^0$/.test(value)) {
            //不能含有汉字和纯数字
            return true;
        }
        return false;
    }

    //获取API信息
    $.get("/trial_account/:_id", async (ctx, next) => {
        var self = ctx;
        var _id = self.params._id;
        var status = 200;
        var result = {};
        var trialModel = self.model('user');
        var row = await trialModel.getRow({
            _id: _id
        });
        if (row) {
            status = 200;
            result = row;
        } else {
            status = 404;
        }
        self.status = status;
        self.body = result;
    });
    //编辑API
    $.put("/trial_account/:_id", async (ctx, next) => {

        var self = ctx;
        var _id = self.params._id;
        var _params = self.request.fields;
        var status = 201;
        //  var statusCode =_params.status;
        var result = {};
        var trialModel = self.model('user');

        var row = await trialModel.findOneAndUpdateRow({
            _id: _id
        }, _params);

        if (row) {
            //发送邮件
            if (row.status == 2) {
                sendEmail(ctx, row['email']);
            }else if(row.status == 1){
                sendEmailPass(ctx, row['email'], row['company'],row['username'],'666666')
            }

            status = 201;
        } else {
            result = "更新失败!";
            status = 400;
        }
        self.status = status;
        self.body = result;
    });
    //生成表格
    $.get("/trial_account_x/:ids", async (ctx, next) => {
        var Excel = require('exceljs');
        var time = Date.now();
        var path = 'xlsx/' + time + '.xlsx';
        var filename = 'public/' + path;
        var workbook = new Excel.Workbook();
        var worksheet = workbook.addWorksheet('My Sheet');
        idsArr = ctx.params.ids.split(",");

        //行头
        worksheet.columns = [
            {header: '企业名称', key: 'mainName', width: 40},
            {header: '行业类型', key: 'group_Name', width: 20},
            {header: '统一社会信用代码', key: 'reg_code', width: 20},
            {header: '公司邮箱', key: 'email', width: 20},
            {header: '联系人姓名', key: 'relate_name', width: 20},
            {header: '手机号', key: 'phone', width: 20},
            {header: '申请时间', key: 'time', width: 40},
            {header: '试用接口', key: 'interface', width: 100},
            {header: '公网uniform', key: 'internet_uniform', width: 40},
        ];
        var common = ctx.library("common");
        var trialModel = ctx.model('user');
        var user_group = ctx.model('user_group');
        if (idsArr) {
            //查询数据
            for (let i = 0; i < idsArr.length; i++) {
                var str = idsArr[i];

                var row = await trialModel.getRow({'_id': str});
                var group_id = row['user_group']
                var group_row = await   user_group.getRow({'_id': group_id})
                if (group_row && group_row.description) {
                    row['group_name'] = group_row['description']
                } else {
                    row['group_name'] = ''
                }

                content = [row['company'], row['group_name'], row['identity_code'], row['email'], row['username'],
                    row['mobile'], common.format_date(row['created'], 'yyyy-MM-dd hh:mm:ss'), row['apis'], row['uniform']]
                worksheet.addRow(content);
            }
        } else {
            result = {
                code: 201,
                url: null,
                msg: '沒有数据'
            }
            ctx.body = result
            return
        }
        await workbook.xlsx.writeFile(filename)
            .then(function () {

            });
        //filename 相对路径
        var Excel = ctx.library('upload_files')
        var path = await Excel.upExcel('试用账号申请', time, filename);

        ctx.body = {
            code: 200,
            url: path,
            msg: '成功'
        }
    });

    //生成表格
    $.get("/trial_account_all/", async (ctx, next) => {
        var Excel = require('exceljs');
        var time = Date.now();
        var path = 'xlsx/' + time + '.xlsx';

        var filename = 'public/' + path;
        var workbook = new Excel.Workbook();
        var worksheet = workbook.addWorksheet('My Sheet');

        //行头
        worksheet.columns = [
            {header: '企业名称', key: 'mainName', width: 40},
            {header: '行业类型', key: 'group', width: 20},
            {header: '统一社会信用代码', key: 'reg_code', width: 20},
            {header: '公司邮箱', key: 'email', width: 20},
            {header: '联系人姓名', key: 'relate_name', width: 20},
            {header: '手机号', key: 'phone', width: 20},
            {header: '申请时间', key: 'time', width: 40},
            {header: '试用接口', key: 'interface', width: 120},
            {header: '公网uniform', key: 'internet_uniform', width: 40},
        ];
        var common = ctx.library("common");
        var trialModel = ctx.model('user');
        var rows = await trialModel.getRows({'trial': 0});
        var user_group = ctx.model('user_group');


        if (rows) {
            //查询数据
            for (let i = 0; i < rows.length; i++) {
                var group_id = rows[i]['user_group']
                var group_row = await   user_group.getRow({'_id': group_id})
                if (group_row && group_row.description) {
                    rows[i]['group_name'] = group_row['description']
                } else {
                    rows[i]['group_name'] = ''
                }
                content = [rows[i]['company'], rows[i]['group_name'], rows[i]['identity_code'], rows[i]['email'], rows[i]['username'],
                    rows[i]['email'], common.format_date(rows[i]['created'], 'yyyy-MM-dd hh:mm:ss'), rows[i]['apis'], rows[i]['uniform']]
                worksheet.addRow(content);
            }
        } else {
            result = {
                code: 201,
                url: null,
                msg: '沒有数据'
            }
            ctx.body = result
            return
        }
        await workbook.xlsx.writeFile(filename)
            .then(function () {
            });
        //filename 相对路径
        var Excel = ctx.library('upload_files')
        var path = await Excel.upExcel('试用账号申请', time, filename);


        ctx.body = {
            code: 200,
            url: path,
            msg: '成功'
        }
    });
    var sendEmail = function (ctx, emailip) {
        var html1 = '<div style="background: url(\'http://images.uniccat.com/HMC151503610879590876864163\') no-repeat;width: 100%;height: auto;-webkit-background-size:cover ;background-size:cover ;box-sizing: border-box;overflow: hidden;";>\n' +
            '<div style="background-color: #fff;margin: 80px auto 20px;box-shadow:inset 0px -3px 0px 0px rgba(53,55,66,0.24);border-radius:4px;background-image: url(\'http://images.uniccat.com/HMC151503617078844045983176\');background-repeat: no-repeat;background-size: 128px;background-position: 50% 20px;box-sizing: border-box;overflow: hidden;width: 600px;height: 80%;min-height: 440px;">\n' +
            '    <div style="width: 100%;height: auto;min-height: 200px;background-color: #f4f5f7;box-sizing: border-box;margin-top: 24%;">\n' +
            '        <p style="padding-left: 40px;padding-top: 20px;color:#57595f;box-sizing: border-box">\n' +
            '           很遗憾，您的黑猫察试用申请未审核通过~~\n' +
            '        </p>\n' +
            '        <p style="padding-left: 40px;padding-right: 40px;padding-bottom: 20px;color:#57595f;padding-top: 30px;box-sizing: border-box">\n' +
            '           审核结果：未通过<br/>' +
            '           未通过原因：提交信息不全，无法进行参考！<br/>' +
            '           您可以通过完善企业及个人信息，再次申请黑猫察试用账号<br/>' +
            '           感谢您的对黑猫察的信赖和支持！<br/>' +
            '<br/>' +
            '           祝您工作愉快！<br/>' +
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

        var params2 = {
            'from': "cycredit@sUgS9yPWVU62ZzBtECIvgFI2GYvy4GXx.sendcloud.org",
            'to':emailip,
            'subject': '您的黑猫察申请结果提醒',
            'html': html1,
            'respEmailId': 'true',
            'fromName': ' 中青信用管理有限公司  运营部'
        }
        var email = ctx.library('email')
        email.sendCloudEmail(params2)
    }

    var sendEmailPass = function (ctx, emailIp,companyName,userName,passWrod) {
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
