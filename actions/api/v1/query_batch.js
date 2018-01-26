module.exports = function ($) {

    //个人批量查询
    const oneSecond = 1000;//ms

    var moment = require('moment');
    $.get('/api/v1/uploads/:user_id/batch_logs/', async (ctx, next) => {
        var self = ctx;
        var _params = self.request.query;
        var offset = _params.offset ? _params.offset : 0; //下标
        var limit = _params.limit ? _params.limit : config.get("limit"); //取多少个
        var sort = _params.sort ? _params.sort : 1;
        var user_id = self.params.user_id;
        var query_type = _params.query_type ? _params.query_type : 0;

        // 今天
        var today = new Date();
        today.setHours(24);
        today.setMinutes(60);
        today.setSeconds(60);
        today.setMilliseconds(999);
        var oneday = 1000 * 60 * 60 * 24;
        // 上周一
        var last_monday = new Date(today- oneday * 7);
        var end_date = Date.parse(today);
        var start_date = Date.parse(last_monday);
        var params = {
            'user_id': user_id,
            'created': {"$gte": start_date, "$lte": end_date}
        };
        // console.log(params);
        var result = {};
        var status = 200;
        var total = 0;
        var batchModel = self.model("batch_log");
        var rows = await batchModel.getRows(params);

        // console.log("end_date"+moment()+"\n");
        // console.log("start_date"+moment().subtract(7, 'days')+"\n");
        if (rows) {
            total = rows.length;
            var success = await batchModel.getFilteredPagedRows(params, offset, limit, {
                created: sort,
            }, '');
            if (success) {
                status = 200;
                result = {
                    totalPage: total,
                    offset: offset,
                    limit: limit,
                    rows: success,
                };
            } else {
                status = 400;
            }
        }
        self.status = status;
        self.body = result;
    })

    $.post('/api/v1/uploads/:user_id/batch_queries/0', async (ctx, next) => {
        let self = ctx;
        var mongoose = require('mongoose');
        var fs = require('fs');
        //检验方法
        var path = require('path');
        const serverPath = path.join(__dirname, '../../.././public/uploads/');
        if (!fs.existsSync(serverPath)) {
            fs.mkdirSync(serverPath);
        }
        if ('POST' != ctx.method) return await next();
        let helper = self.library("excel_util");
        var Excel = require('exceljs');
        //获取参数
        var _params = self.request.fields;
        var user_id = _params.user_id;
        var batch_id = _params.batch_id;
        var listParams = _params.file;
        var list_params = [].concat(listParams);
        list_params.unshift("");
        var listSize = listParams.length;

        //添加group_id
        let timeNow = Date.now()
        for(let i= 1;i<list_params.length;i++){
            let group_id = i+""+timeNow;
            list_params[i].group_id = group_id;
        }

        //获取所有授权权限信息
        var userModel = ctx.model('user');
        var user = await userModel.getRow({"_id": user_id})
        var user_company = user.company;
        var balance = user.balance;

        var applyModel = ctx.model('api_apply');
        var applies = await applyModel.getRows({user_id: user_id});
        var apiModel = ctx.model('api');
        //去除企业接口
        var apiEnt = await apiModel.getRow({"identifier": "entinfo"});
        var apiIdArr = [];
        var apiTmpObj = [];
        if (applies) {
            applies.forEach(function (apply) {
                if (apply.api_id != apiEnt._id && apply.status == 1) {
                    api = {api_id: apply.api_id, price: apply.price}
                    apiTmpObj.push(api);
                    apiIdArr.push(mongoose.Types.ObjectId(apply.api_id));
                }
            })
        }

        //余额查询
        var price_sum = 0;
        if (apiTmpObj.length > 0) {
            apiTmpObj.forEach(function (api) {
                price_sum += api.price;
            })
        }
        var consumption = listSize * price_sum;
        if (balance - consumption < 0) {
            self.status = 403;
            self.body = "余额不足"
            return
        }

        var apiServer = await apiModel.getRows({"_id": {$in: apiIdArr}});
        var apisIdentifierArr = [];
        apiServer.forEach(function (api) {
            apisIdentifierArr.push(api.identifier);
        })


        let nowTime = moment(new Date()).format("YYYYMMDDHHmmss");
        let fileName = user_id + "_" + nowTime;
        var filenameOut = serverPath + fileName + "_result_" + nowTime + '.xlsx';

        //获取测试数据参数
        //每秒测试20条数据
        let sendNumber = 20;
        let index = 0;
        let times = Math.ceil((list_params.length - 1) / sendNumber);

        //初始化workbook
        var workbook = new Excel.Workbook();
        workbook.creator = 'YoungCredit';
        workbook.modified = new Date();
        //根据用户权限，选择初始化sheet
        if (apisIdentifierArr.includes("jinrong")) {
            let sheet1 = workbook.addWorksheet("金融逾期");
            await helper.titleJinRongSheet(sheet1);
        }

        if (apisIdentifierArr.includes("duotou")) {
            let sheet2 = workbook.addWorksheet("多头借贷");
            await helper.titleDuoTouSheet(sheet2);
        }

        if (apisIdentifierArr.includes("fanzui")) {
            let sheet3 = workbook.addWorksheet("犯罪不良");
            await helper.titleFanZuiSheet(sheet3);
        }

        if (apisIdentifierArr.includes("gaofa")) {
            let sheet4 = workbook.addWorksheet("高法失信");
            await helper.titleGaoFaSheet(sheet4);
        }

        //开始查询并写入excel
        let batchParams = {};
        let batchModel = ctx.model("batch_log");
        batchParams.user_id = user_id;
        batchParams.batch_id = batch_id;
        batchParams.finished = 0;
        batchParams.total = listSize*apisIdentifierArr.length;
        batchParams.status = 0;
        let batch = await batchModel.createRow(batchParams);
        if(batch){
            console.log("created one batch!");
        }
        let startGaofa = 0;
        let finished = 0;
        let startTime = moment();
        var interval = setInterval(async function () {
            try{
                await index++;
                if (index <= times) {
                    finished = await helper.writeExcel(ctx, workbook, apiServer, applies, user_id, batch_id, apisIdentifierArr, list_params, index, sendNumber, filenameOut, startGaofa, finished);
                    if(finished == batch.total){
                        let urlName = user_company+"_" +nowTime+".xlsx";
                        let uploadSuccess = await uploadToQiNiu(ctx,batch_id,urlName,filenameOut);
                        if(uploadSuccess=="上传失败"){
                            await batchModel.updateRow({batch_id:batch_id},{status:1,url:filenameOut});
                        }else {
                            let url = config.get('qiniu_host')+ urlName;
                            await batchModel.updateRow({batch_id:batch_id},{status:1,url:url});
                        }
                    }else if(moment()>startTime+1000*60*10){
                        await batchModel.updateRow({batch_id:batch_id},{status:2,url:"上传失败"});
                    }
                } else {
                    clearInterval(interval);
                }
            }catch(e){
                await batchModel.updateRow({batch_id:batch_id},{status:2});
                console.log(e);
            }
        }, 3 * oneSecond);

        self.status = 200;
        self.body = "上传成功";
    })

    async function uploadToQiNiu(ctx,batch_id,urlName,filePath) {
        const qi_niu = require('qiniu');
        //需要填写你的 Access Key 和 Secret Key
        var accessKey = 'HyiV7hZ6-vH0ZSyEubxYAhXPyLFb-aJ4Q2ukz_4l';
        var secretKey = 'rrqgLZCgI8ql60iMaGK055jdDTtfknpwI48zaWTF';
        qi_niu.conf.ACCESS_KEY = accessKey;
        qi_niu.conf.SECRET_KEY = secretKey;
        var bucket = 'excel';
        var putPolicy = new qi_niu.rs.PutPolicy(bucket + ":" + urlName);
        let token = putPolicy.token()
        // console.log(token);
        await qi_niu.io.putFile(token, urlName, filePath, null, async function (err, ret) {
            let url =  config.get('qiniu_host')+ urlName;
            if (!err) {
                let batchModel = ctx.model("batch_log");
                await batchModel.updateRow({batch_id:batch_id},{status:1,url:url});
                // 上传成功， 处理返回值
                return await url;
            } else {
                // 上传失败， 处理返回代码
                console.log('上传失败');
                let batchModel = ctx.model("batch_log");
                await batchModel.updateRow({batch_id:batch_id},{status:2,url:filePath});
                console.log(err)
                url = "上传失败";
                return await url
            }
        });
    }
}

