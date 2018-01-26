module.exports = function ($) {

    //计费
    $.get("/consumptions/refresh", async (ctx, next) => {
        var self = ctx;
        var queryLogModel = self.model('query_log');
        var opt = {
            query: {},
            sort: {
                created: -1
            },
            out: {
                replace: 'consumptions'
            },
            map: function () {
                emit(self.user_id + '-' + self.apply_id + '-' + self.group_id, {
                    result: self.result,
                    apis: [self.api_id],
                    created: self.created
                })
            },
            reduce: function (k, vals) {
                var apis = [];
                var result = 0;
                vals.forEach(function (v) {
                    v.apis.forEach(function (a) {
                        apis.push(a)
                    });

                    if (v.result) {
                        result = 1;
                    }
                });

                var ks = k.split('-');
                return {
                    result: result,
                    apis: apis,
                    created: vals[vals.length - 1].created,
                    user_id: ks[0],
                    apply_id: ks[1],
                    group_id: ks[2]
                }
            }
        };

        queryLogModel.mr(opt, function (err, rows) {

        });

        self.status = 200;
        self.body = {}
    });

    //消费明细
    $.get("/consumptions", async (ctx, next) => {
        var self = ctx;

        //admin 角色才可访问
        if (!self.session.user || !(self.session.user_type == 'admin')) {
            self.redirect('/login');
            return;
        }

        var _params = self.request.query;
        var offset = _params.offset ? _params.offset : 0;
        var limit = _params.limit ? _params.limit : config.get("limit");
        //格式化时间
        var fromTime = Date.parse(new Date(_params.from));
        var toTime = Date.parse(new Date(_params.to));

        var result = {};
        var status = 200;

        var params = {};
        if (fromTime && toTime) {
            params['created'] = {"$gte": parseInt(fromTime), "$lte": parseInt(toTime) + 86400000};
        }
        //查询满足条件的所有用户ID
        var username = _params["username"] ? _params["username"] : "";
        var company = _params["company"] ? _params["company"] : "";
        if (username != '' || company != '') {
            var userModel = self.model("user");

            var p = {}
            if (username != '') {
                p.username = new RegExp(username, 'i')
            }
            if (company != '') {
                p.company = new RegExp(company, 'i')
            }

            var users = await userModel.getRows(p);
            var ids = []
            if (users) {
                users.forEach(function (user) {
                    ids.push(user._id);
                })
            }
            params.user_id = {
                $in: ids
            };
        }

        var elemMatch = {$elemMatch: {}}
        var api_id = _params["api_id"] && _params["api_id"] != "all" ? _params["api_id"] : "";
        if (api_id != '') {
            var mongoose = require('mongoose');
            elemMatch.$elemMatch['api._id'] = mongoose.Types.ObjectId(api_id);
        }

        var query_status = _params["query_status"] && _params["query_status"] != "all" ? _params["query_status"] : "";
        if (query_status != '') {
            elemMatch.$elemMatch['query_status'] = parseInt(query_status);
        }

        params.queries = elemMatch;

        var fields = {}
        if (Object.keys(params.queries.$elemMatch).length > 0) {
            fields = {
                apply_id: 1,
                group_id: 1,
                user_id: 1,
                created: 1,
                'queries.$': 1
            }
        } else {
            delete params.queries;
        }

        var queryLogModel = self.model("query_log");

        var totalPage = 0;
        var count = await queryLogModel.getRowsCount(params);
        if (count) {
            totalPage = Math.ceil(count / limit);
        }

        var rows = await queryLogModel.getFilteredPagedRows(params, offset, limit, {
            created: -1
        }, fields);

        if (rows) {
            result = {
                rows: rows,
                offset: offset,
                limit: limit,
                totalPage: totalPage,
                username: username,
                company: company,
                api_id: api_id,
                query_status: query_status
            };
        } else {
            status = 400;
        }

        //获取用户信息
        var rows = []
        for (var i in result.rows) {
            var row = result.rows[i];
            row = row.toObject();
            rows.push(row);

            var userModel = self.model("user");
            var user_id = row.user_id;
            var user = await userModel.getRow({
                _id: user_id
            });
            if (user) {
                row.user = user;
            } else {
                row.user = {};
            }
        }
        result.rows = rows;
        //获取API列表
        var apiModel = self.model("api");
        var apis = await apiModel.getRows({}, {
            created: -1
        });
        if (apis) {
            result.apis = apis;
        } else {
            result.apis = [];
        }

        var common = self.library("common");
        result.common = common;
        result.title = '消费明细';
        result['from'] = _params.from;
        result['to'] = _params.to;
        await self.render('consumptions/consumptions', result);
    });


    //生成表格
    $.get("/consumptions_excel/", async (ctx, next) => {
        var self = ctx;
        var Excel = require('exceljs');
        var time = Date.now();
        var path = 'xlsx/' + time + '.xlsx';
        var filename = 'public/' + path;
        var workbook = new Excel.Workbook();
        var worksheet = workbook.addWorksheet('My Sheet');
        //行头
        worksheet.columns = [
            {header: '用户名', key: 'username', width: 20},
            {header: '公司', key: 'company', width: 20},
            {header: '查询方式', key: 'query_method', width: 15,},
            {header: 'API', key: 'api', width: 45},
            {header: '费用', key: 'money', width: 10},
            {header: '状态', key: 'status', width: 10},
            {header: '计费方式', key: 'method', width: 30},
            {header: '消费明细', key: 'interface', width: 30},
            {header: '查询参数', key: 'query', width: 80},
            {header: '查询时间', key: 'time', width: 20},
        ];
        var common = ctx.library("common");
        //获取数据
        var _params = self.request.query;
        //格式化时间
        var fromTime = Date.parse(new Date(_params.from));
        var toTime = Date.parse(new Date(_params.to));
        var params = {};
        if (fromTime && toTime) {
            params['created'] = {"$gte": parseInt(fromTime), "$lte": parseInt(toTime) + 86400000};
        }
        //查询满足条件的所有用户ID
        var username = _params["username"] ? _params["username"] : "";
        var company = _params["company"] ? _params["company"] : "";
        if (username != '' || company != '') {
            var userModel = self.model("user");

            var p = {}
            if (username != '') {
                p.username = new RegExp(username, 'i')
            }
            if (company != '') {
                p.company = new RegExp(company, 'i')
            }
            var users = await userModel.getRows(p);
            var ids = []
            if (users) {
                users.forEach(function (user) {
                    ids.push(user._id);
                })
            }
            params.user_id = {
                $in: ids
            };
        }
        var elemMatch = {$elemMatch: {}}
        var api_id = _params["api_id"] && _params["api_id"] != "all" ? _params["api_id"] : "";
        if (api_id != '') {
            var mongoose = require('mongoose');
            elemMatch.$elemMatch['api._id'] = mongoose.Types.ObjectId(api_id);
        }
        var query_status = _params["query_status"] && _params["query_status"] != "all" ? _params["query_status"] : "";
        if (query_status != '') {
            elemMatch.$elemMatch['query_status'] = parseInt(query_status);
        }
        params.queries = elemMatch;
        var fields = {}
        if (Object.keys(params.queries.$elemMatch).length > 0) {
            fields = {
                apply_id: 1,
                group_id: 1,
                user_id: 1,
                created: 1,
                'queries.$': 1
            }
        } else {
            delete params.queries;
        }
        var queryLogModel = self.model("query_log");
        var rows = await queryLogModel.getRows(params, {
            created: -1
        }, fields);
        if (rows&&rows.length<5000) {
            result = {
                rows: rows,
                username: username,
                company: company,
                api_id: api_id,
                query_status: query_status
            };
        } else {
            ctx.status = 400;
            ctx.body={
                msg:'生成数量最大不超过5000条'
            }
            return
        }
        //获取用户信息
        var rows = []
        for (var i in result.rows) {
            var row = result.rows[i];
            try {
                row = row.toObject();
            }catch (e){
            }
            rows.push(row);
            var userModel = self.model("user");
            var user_id = row.user_id;
            var user = await userModel.getRow({
                _id: user_id
            });
            if (user) {
                row.user = user;
            } else {
                row.user = {};
            }
        }
        result.rows = rows;
        //获取API列表
        var apiModel = self.model("api");
        var apis = await apiModel.getRows({}, {
            created: -1
        });
        if (apis) {
            result.apis = apis;
        } else {
            result.apis = [];
        }
        if (result.rows) {
            //查询数据
            for (let i = 0; i < rows.length; i++) {
                rowSheet = result.rows[i]
                var username = rowSheet['user']['username']
                var company = rowSheet['user']['company']
                var query_method = rowSheet['group_id'] ? "WEB端查询" : "API调用"
                var api = '';
                var queries = rowSheet['queries'];
                queries.forEach(function (q) {
                    var name = q.api ? q.api.name : '';
                    api = api + '   \n' + name
                });
                var total = 0;
                queries.forEach(function (q) {
                    total += q.charged;
                });
                var status = 0;
                queries.forEach(function (q) {
                    if (q.query_status == 1) {
                        status = 1;
                    }
                });
                var method = ''
                queries.forEach(function (q) {
                    var billing_mode = q.apply ? (q.apply.billing_mode == 0 ? '查询' : '查得') : '';
                    method = method + '  \n' + billing_mode
                });
                var pay = ''

                queries.forEach(function (q) {
                    paystr = q.charged ? q.charged.toFixed(2) : "0"
                    pay = pay + '  \n' + paystr + '元'
                });
                var req_params = ''
                queries.forEach(function (q) {
                    var query = JSON.parse(q.query)
                    var req_param = '';
                    if (query.identity_name) {
                        req_param = req_param + ' ' + query.identity_name
                    }
                    if (query.identity_code) {
                        req_param = req_param + ' ' + query.identity_code
                    }
                    if (query.mobile) {
                        req_param = req_param + ' ' + query.mobile
                    }
                    req_params = req_params + '  \n' + req_param
                });
                var time_created = common.format_date(rowSheet['created'], 'yyyy-MM-dd hh:mm:ss')
                content = [username, company, query_method, api, total + '元', status == 1 ? '匹配' : '未匹配', method, pay, req_params, time_created]
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
        var path = await Excel.upExcel('账户明细', time, filename);
        ctx.body = {
            code: 200,
            url: path,
            msg: '成功'
        }
    });
};
