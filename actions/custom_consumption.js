module.exports = function ($) {
    //客户账单
    $.get("/custom_consumptions", async (ctx, next) => {
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
        var apiModel = ctx.model('api');
        var apiApplyModel = ctx.model('api_apply');
        var queryLogModel = ctx.model('query_log');
        if (name && name !== 'undefined') {
            params['company'] = eval("/" + name + "/i");
        }
        // params['provider'] = {"$ne": "中青信用"};
        var userModel = ctx.model('user');
        var totalPage = 0;
       params['status'] = {"$nin": [0, 2]};
        //{$or:[{age:11},{name:'xttt'}]}
        params['$or']=[{trial:1},{trial:0,status:{"$nin": [0, 2]}}]
        var users_rows = await userModel.getPagedRows(params, offset, limit,{
            'created':-1
        });
        var count = await userModel.getRowsCount(params);
        var api_id = _params["api_id"] && _params["api_id"] != "all" ? _params["api_id"] : "";
        var  users =[]
        if (_params["api_id"] ){
            if ( _params["api_id"] != "all"){
                if (users_rows) {
                    for (ai = 0; ai < users_rows.length; ai++) {
                        var rows = await apiApplyModel.getRows({'user_id': users_rows[ai]['_id'] + ''}, {
                            'provider': -1
                        });
                        for (i=0;i<rows.length;i++){
                            if (_params["api_id"]==rows[i]['api_id']){
                                users.push(users_rows[ai])
                            }
                        }
                    }
                }
            }else {
                users=users_rows
        }
        }else {
            users=users_rows
        }

        if (count) {
            totalPage = Math.ceil(count / limit);
        }
        //总数量
        if (users) {
            for (ai = 0; ai < users.length; ai++) {
                //Api集合
                var rows = await apiApplyModel.getRows({'user_id': users[ai]['_id'] + ''}, {
                    'provider': -1
                });

                for (i = 0; i < rows.length; i++) {
                    if (rows[i]['api_id']) {
                        apiRow = await apiModel.getRow({'_id': rows[i]['api_id'] + ''})
                    }
                    try {
                        if (apiRow) {
                            rows[i]['name'] = apiRow.name
                        }
                    }
                    catch (e){

                    }


                }
                //通过user_id 查询api
                let params_search = {'user_id': users[ai]['_id'] + ''};
                params_search['created'] = {"$gte": start_time, "$lte": end_time}
                //根据挨api_id 分组 ？
                let countRows = await queryLogModel.aggregate([
                    {$unwind: "$queries"},
                    {$match: params_search},
                    {
                        $group: {
                            _id: '$queries.api._id',
                            query_times: {$sum: 1},
                            hit_times: {$sum: 1},
                            cost_total: {$sum: '$queries.charged'}
                        }
                    }
                ]);
            //    console.log(countRows);
                //查得统计支出
                params_search['queries.apply.billing_mode'] = 1;
                params_search['queries.query_status'] = 1;
                var costRows = await queryLogModel.aggregate([
                    {$unwind: "$queries"},
                    {$match: params_search},
                    {$group: {_id: '$queries.api._id', hit_times: {$sum: 1}, cost_total: {$sum: '$queries.charged'}}}
                ]);
                //如果costRows 为空       查得的 api 全赋值为 0
                userApplyApi =[] ;
                userApplyAp=[]
                if(rows){
                    for(i=0;i<rows.length;i++){
                        if (rows[i].billing_mode==1){
                            userApplyAp['_id']=rows[i]['api_id']
                            userApplyAp['hit_times']=0
                            userApplyAp['cost_total']=0
                            userApplyApi.push(userApplyAp)
                        }
                    }
                }
                for (m=0;m<costRows.length;m++) {
                  for(s=0;s<userApplyApi.length;s++){
                      if (userApplyApi[s]['_id'].toString() == costRows[m]['_id'].toString()) {
                          userApplyApi[s]['cost_total'] = costRows[m]['cost_total'];
                          userApplyApi[s]['hit_times'] = costRows[m]['hit_times'];
                      }
                  }
                }
                for (let i = 0; i < countRows.length; i++) {
                    for (let k = 0; k < userApplyApi.length; k++) {
                        if (countRows[i]['_id'].toString() == userApplyApi[k]['_id'].toString()) {
                            countRows[i]['cost_total'] = userApplyApi[k]['cost_total'];
                            countRows[i]['hit_times'] = userApplyApi[k]['hit_times'];
                        }
                    }
                }
                if (rows) {
                    for (let i = 0; i < rows.length; i++) {
                        if ("" != end_time && "" != start_time) {
                            //统计支出
                            for (let j = 0; j < countRows.length; j++) {
                                if (String(rows[i].api_id) == countRows[j]._id) {
                                    rows[i]['query_number'] = countRows[j].query_times.toFixed(0);
                                    rows[i]['hit_number'] = countRows[j].hit_times.toFixed(0);
                                    rows[i]['cost_total'] = countRows[j].cost_total.toFixed(2);
                                }
                            }
                        }
                    }
                }
                users[ai]['rows'] = rows
                console.log(rows);
            }

        }


        var result = {
            rows: users,
            offset: offset,
            limit: limit,
            totalPage: totalPage,
            api_id: api_id,
            key_word: name,
            from: from,
            to: to,
        };

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
        result.title = '客户账单';
        await self.render('consumptions/custom_consumptions', result);
    });
};
