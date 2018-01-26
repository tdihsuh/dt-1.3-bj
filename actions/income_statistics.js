module.exports = function ($) {
        //收入统计
    $.get("/income_statistics", async (ctx, next) => {
        var self = ctx;
        var moment = require('moment');
        //admin 角色才可访问
        if (!self.session.user || !(self.session.user_type == 'admin')) {
            self.redirect('/login');
            return;
        }
        //时间转化成毫秒数
        //参数包括 user_id  开始时间 结束时间
        var _params = self.request.query;
        var offset = _params.offset ? _params.offset : 0;
        var limit = _params.limit ? _params.limit : config.get("limit");
       //设置默认日期格式
        var defaultStartDate = moment().format('YYYY-MM') + "-01";
        var defaultEndDate = moment().format('YYYY-MM') + "-" + moment().endOf("month").format("DD");
        //设置默认时间
        var defaultStartTime = new Date(defaultStartDate).getTime();
        var defaultEndTime = new Date(defaultEndDate).getTime();
        //格式化时间
        var fromTime = Date.parse(new Date(_params.from));
        var toTime = Date.parse(new Date(_params.to));
        //格式化日期毫秒数
        var startDate = fromTime ? fromTime : defaultStartTime;
        var endDate = toTime ? toTime: defaultEndTime;
        //格式化日期
        var startDateFormat = _params.from ? _params.from : defaultStartDate
        var endDateFormat = _params.to ? _params.to : defaultEndDate;
        //关键字查询
        var keyword = _params.keyword;
        var params = {};
        startDate = parseInt(startDate);
        endDate = parseInt(endDate) + 86400000; //加上1天的毫秒数
        //查询api 类型   apis 表 获取name  api_id    api applies ->price
        var apiModel = self.model('api');
        var query_log_Model = self.model('query_log');
        //关键字拼接
        if (keyword && keyword !== 'undefined') {
            params['name'] = eval("/" + keyword + "/i");
        }
        var apiRows = await apiModel.getPagedRows(params, offset, limit, {
            'created': -1
        });
        //收入: charged 总和
        //成本: billing_mode']==0?"查询计费":"查得计费"
        params_search = {};
        if (startDate && endDate) {
            params_search['created'] = {"$gte": startDate, "$lte": parseInt(endDate)};
        }
        console.log(params_search);
        //统计总收入
        var countRows = await query_log_Model.aggregate([
            {$unwind: "$queries"},
            {$match: params_search},
            {$group: {_id: '$queries.api._id', cost: {$sum: '$queries.api.price'}, income: {$sum: '$queries.charged'}}}
        ]);



        //查得统计支出
        params_search['queries.api.billing_mode'] = 1;
        params_search['queries.query_status'] = 1;
        var costRows = await query_log_Model.aggregate([
            {$unwind: "$queries"},
            {$match: params_search},
            {$group: {_id: '$queries.api._id', cost: {$sum: '$queries.api.price'}}}
        ]);

        for (let i = 0; i < countRows.length; i++) {
            for (let k = 0; k < costRows.length; k++) {
                if (countRows[i]['_id'].toString() == costRows[k]['_id'].toString()) {
                    countRows[i]['cost'] = costRows[k]['cost']
                }
            }
        }
        for (let g = 0; g < apiRows.length; g++) {
            //group 第一个id 是groupBy 分组
            if (countRows.length == 0) {
                apiRows[g]['total_cost'] = 0.00;
                apiRows[g]['total_income'] = 0.00;
                apiRows[g]['total_profit'] = 0.00;
                continue;
            }
            for (let i = 0; i < countRows.length; i++) {
                var sumId = apiRows[g]['_id'] + "";
                if (sumId == countRows[i]['_id']) {
                    apiRows[g]['total_cost'] = countRows[i]['cost'].toFixed(2);
                    apiRows[g]['total_income'] = countRows[i]['income'].toFixed(2);
                    apiRows[g]['total_profit'] = (countRows[i]['income'] - countRows[i]['cost']).toFixed(2);
                    break;
                } else {
                    apiRows[g]['total_cost'] = 0.00;
                    apiRows[g]['total_income'] = 0.00;
                    apiRows[g]['total_profit'] = 0.00;
                }
            }
        }
        //总数量
        var totalPage = 0;
        var count = await apiModel.getRowsCount(params);
        if (count) {
            totalPage = Math.ceil(count / limit);
        }
        result = {
            rows: apiRows,
            offset: offset,
            limit: limit,
            totalPage: totalPage,
            from: startDateFormat,
            to: endDateFormat
        };
        //关键字拼接
        if (keyword == "undefined") {
            result['keyword'] = '';
        } else {
            result['keyword'] = keyword;
        }
        var common = self.library("common");
        result.common = common;
        result.title = '收入统计';
        await self.render('consumptions/income_statistics', result);
    });

};