module.exports = function ($) {
    //三方消费明细
    $.get("/third_api_consumptions", async (ctx, next) => {
        var self = ctx;
        var moment = require('moment');
        //admin 角色才可访问
        if (!self.session.user || !(self.session.user_type == 'admin')) {
            self.redirect('/login');
            return;
        }
        //参数包括 user_id  开始时间 结束时间
        var _params = self.request.query;
        var offset = _params.offset ? _params.offset : 0;
        var limit = _params.limit ? _params.limit : config.get("limit");
        var defaultStartDate = moment().format('YYYY-MM') + "-01";
        var defaultEndDate = moment().format('YYYY-MM') + "-" + moment().endOf("month").format("DD");

        var from = _params.from ? _params.from : defaultStartDate;
        var to = _params.to ? _params.to : defaultEndDate;
        var name = _params.key_word ? _params.key_word : "";
        var params = {};

        let start_time;
        let end_time;

        if ("" != from && "" != to) {

            let startDay = new Date(from);
            let endDay = new Date(to);
            startDay.setHours(0);
            startDay.setMinutes(0);
            startDay.setSeconds(0);
            startDay.setMilliseconds(0);
            endDay.setHours(23);
            endDay.setMinutes(59);
            endDay.setSeconds(59);
            endDay.setMilliseconds(999);
            start_time = startDay.getTime();
            end_time = endDay.getTime();
        }
        if (name && name !== 'undefined') {
            params['name'] = eval("/" + name + "/i");
        }
        // params['provider'] = {"$ne": "中青信用"};
        //总数量
        var apiModel = ctx.model('api');
        var queryLogModel = ctx.model('query_log');
        var totalPage = 0;
        var count = await apiModel.getRowsCount(params);
        if (count) {
            totalPage = Math.ceil(count / limit);
        }
        var rows = await apiModel.getPagedRows(params, offset, limit, {
            'provider': -1
        });
        let params_search = {};
        params_search['created'] = {"$gte": start_time, "$lte": end_time};
        let countRows = await queryLogModel.aggregate([
            {$unwind: "$queries"},
            {$match: params_search},
            {$group: {_id: '$queries.api._id', query_times: {$sum: 1}, hit_times:{$sum:1}, cost_total: {$sum: '$queries.api.price'}}}
        ]);

        //查得统计支出
        params_search['queries.api.billing_mode'] = 1;
        params_search['queries.query_status'] = 1;
        var costRows = await queryLogModel.aggregate([
            {$unwind: "$queries"},
            {$match: params_search},
            {$group: {_id: '$queries.api._id', hit_times:{$sum:1},cost_total: {$sum: '$queries.api.price'}}}
        ]);

        for (let i = 0; i < countRows.length; i++) {
            for (let k = 0; k < costRows.length; k++) {
                if (countRows[i]['_id'].toString() == costRows[k]['_id'].toString()) {
                    countRows[i]['cost_total'] = costRows[k]['cost_total'];
                    countRows[i]['hit_times'] = costRows[k]['hit_times'];
                }
            }
        }
        if (rows) {
            for (let i = 0; i < rows.length; i++) {
                if ("" != end_time && "" != start_time) {
                    //统计支出
                    for (let j = 0; j < countRows.length; j++) {
                        if(String(rows[i]._id)==countRows[j]._id){
                            rows[i].query_number = countRows[j].query_times.toFixed(2);
                            rows[i].hit_number = countRows[j].hit_times.toFixed(2);
                            rows[i].cost_total = countRows[j].cost_total.toFixed(2);
                        }
                    }
                }
            }
        }
        var result = {
            rows: rows,
            offset: offset,
            limit: limit,
            totalPage: totalPage,
            key_word: name,
            from: from,
            to: to,
        };
        var common = self.library("common");
        result.common = common;
        result.title = '三方对账单';
        await self.render('consumptions/third_api_consumptions', result);
    });
};
