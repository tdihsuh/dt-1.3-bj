module.exports = function ($) {
    /**
     * html to pdf
     */
    $.get("/api/v1/transformed/pdf", async (ctx, next) => {
            var self = ctx
            var result = {}
            var _params = self.request.query;
            var user_id = _params.user_id
            var time = _params.time;
            var query_type = parseInt(_params.query_type);
            var start_date = parseInt(_params.start_date);
            var end_date = parseInt(_params.end_date);
            var queryMode = self.model("query_log");
            var params = {};

            // write to a file
            var Excel = require('exceljs');
            var path = 'xlsx/' + user_id + time + '.xlsx';
            var filename = 'public/' + path;
            var workbook = new Excel.Workbook();
            var worksheet = workbook.addWorksheet('My Sheet');
            //查询数据  时间查询   关键字 模糊查询  query_type 0个人 1企业  2 全部  start_date     end_date  // char_key  关键字
            if (query_type == 2) {
                params = {
                    'user_id': user_id,
                    created: {"$gte": start_date, "$lte": end_date},
                }
            } else {
                params = {
                    'user_id': user_id,
                    'queries.query_type': query_type,
                    created: {"$gte": start_date, "$lte": end_date},
                }
            }
            var rows = await queryMode.getRows(params, {
                'created': -1,
            });
            if (rows) {
                worksheet.columns = [
                    {header: '主体编码', key: 'mainCode', width: 25},
                    {header: '主体名称', key: 'mainName', width: 25},
                    {header: '主体类型', key: 'queryType', width: 15},
                    {header: '查询状态', key: 'queryStatus', width: 20},
                    {header: '支出金额', key: 'price', width: 10},
                    {header: '查询时间', key: 'time', width: 25},
                ];
                var common = self.library("common");
                var content = '';

                for (var i = 0, len = rows.length; i < len; i++) {
                    var code = '';
                    if (rows[i]['queries'][0].query_type == 0) {
                        // code = replace(/(\d{10})\d{4}(\d{4})/, "$1****$2");
                        code = replace_Str(JSON.parse(rows[i]['queries'][0].query).identity_code)
                    } else {
                        code = JSON.parse(rows[i]['queries'][0].query).identity_code;
                    }
                    content = [code, rows[i]['queries'][0].query_type == 1 ? JSON.parse(rows[i]['queries'][0].query).identity_name : JSON.parse(rows[i]['queries'][0].query).identity_name, rows[i]['queries'][0].query_type == 1 ? '企业' : '个人', status(rows[i]) == 1 ? '匹配' : '不匹配',
                        +addCharged(rows[i]), common.format_date(rows[i]['created'], 'yyyy-MM-dd hh:mm:ss')]
                    worksheet.addRow(content);

                }
            } else {
                result = {
                    code: 201,
                    url: null,
                    msg: '沒有数据'
                }
                self.body = result
                return
            }
            await workbook.xlsx.writeFile(filename)
                .then(function () {
                });
            //filename 相对路径
            var Excel = ctx.library('upload_files')
            var path = await Excel.upExcel('消费明细', time, filename);
            self.body = {
                code: 200,
                url: path,
                msg: '成功'
            }
        }
    );

    function status(rows) {

        for (var i = 0; i < rows['queries'].length; i++) {

            if (rows['queries'][i].query_status == 1) {
                return 1
            }
        }
        return 0
    }

    //计算总价格
    function addCharged(rows) {
        var addPrice = 0;
        for (var i = 0; i < rows['queries'].length; i++) {
            var price = rows['queries'][i].charged;
            addPrice = addPrice + price;
        }

        return addPrice
    }

    function replace_Str(val) {
        if (!val) {
            return
        }
        let arr = val.split("");
        arr[10] = "*";
        arr[11] = "*";
        arr[12] = "*";
        arr[13] = "*";
        return arr.join('');
    }
}
