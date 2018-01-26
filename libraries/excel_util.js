var helper = module.exports = {}


// let geoApi = require("./geo/api");
// let xinyanApi = require("./xinyan/api");
var Excel = require('exceljs');
var path = require('path');
var excelPath = path.resolve(__dirname, '..') + '/'
let identifierJinRong = "jinrong";
let identifierDuoTou = "duotou";
let identifierFanZui = "fanzui";
let identifierGaoFa = "gaofa";

helper.readExcel = async function (inputExcelName) {

    var filename = excelPath + inputExcelName + '.xlsx';

    let start = 2
    let interval = 1001;
    // let interval = 2501;

    var workbook = new Excel.Workbook();
    var listParams = new Array();
    listParams = await workbook.xlsx.readFile(filename)
        .then(async function () {
            // use workbook
            var worksheet = workbook.getWorksheet(1);
            var phonesCol = worksheet.getColumn(3);
            await phonesCol.eachCell({includeEmpty: false}, async function (cell, rowNumber) {
                if (rowNumber >= start && rowNumber <= interval) {
                    let row0 = worksheet.getRow(rowNumber);
                    let params = {
                        'realName': row0.getCell(1).value,
                        'idCode': row0.getCell(2).value,
                        'phoneNumber': cell.value + '',
                    }
                    listParams[rowNumber - 1] = params;
                }
            })
            return await listParams;
        });
    return await listParams;
}
// var flag = true
var oneSecond = 1000 * 1;

async function test(ctx) {
    let fileName = "中青数据测试样本-发薪贷";
    let nowTime = Date.now();
    var filenameOut = excelPath + fileName + "_result_" + nowTime + '.xlsx';
    let helper = ctx.library("excel_util");
    //获取测试数据参数
    let list_params = await helper.readExcel(fileName);
    //每秒测试20条数据
    let sendNumber = 20
    let index = 0
    // let times = Math.ceil((list_params.length - 1) / sendNumber);
    let times = 1;

    var workbook = new Excel.Workbook();
    workbook.creator = 'YoungCredit';
    workbook.modified = new Date();

    // let sheet1 = workbook.addWorksheet("金融逾期");
    // await helper.titleJinRongSheet(sheet1);
    // let sheet2 = workbook.addWorksheet("多头借贷");
    // await helper.titleDuoTouSheet(sheet2);

    // let sheet3 = workbook.addWorksheet("犯罪不良");
    // await helper.titleFanZuiSheet(sheet3);
    let sheet4 = workbook.addWorksheet("高法失信");
    await helper.titleGaoFaSheet(sheet4);
    // await workbook.xlsx.writeFile(filenameOut).then();
    let startGaofa = 3;
    var interval = setInterval(async function () {
        await index++;
        if (index <= times) {
            await helper.writeExcel(ctx, workbook, apiServer, list_params, index, sendNumber, filenameOut, startGaofa)
        } else {
            clearInterval(interval);
        }
    }, oneSecond);
}

async function test2() {
    result = "{\"result_YQ_ZZSJ\":null,\"result_YQ_ZJSJ\":null,\"result_YQ_LJCS\":\"[1,3)\",\"result_YQ_DQJE\":null,\"result_YQ_DQSC\":null,\"result_YQ_ZDJE\":\"0.2-0.5\",\"result_YQ_ZDSC\":\"M3\",\"result_QZ_ZZSJ\":null,\"result_QZ_ZJSJ\":null,\"result_QZ_LJCS\":null,\"result_SX_ZZSJ\":null,\"result_SX_ZJSJ\":null,\"result_SX_LJCS\":null}"
    let oneJson = JSON.parse(result);
    console.log(typeof oneJson);
    console.log(oneJson.result_YQ_LJCS);
    console.log(oneJson["result_YQ_LJCS"]);
}

// test2();

helper.writeExcel = async function (ctx, workbook, apiServer, applies, userId, batchId, apisIdentifierArr, listParams, index, sendNumber, filenameOut, startGaofa, finished) {
    try {
        // let groupId = new Date().getTime() + "" + Math.floor(Math.random() * 100000000000);

        //根据用户权限，选择查询的接口
        if (apisIdentifierArr.includes(identifierJinRong)) {
            let apiId = helper.getApiIdByIdentifier(apiServer, identifierJinRong);
            let applyId = await helper.getApplyIdByApiId(applies, apiId);
            let worksheet1 = workbook.getWorksheet("金融逾期");
            await helper.writeJinRongSheet(ctx, worksheet1, listParams, index, sendNumber, batchId, apiId, applyId, userId);
        }

        if (apisIdentifierArr.includes(identifierDuoTou)) {
            let apiId = await helper.getApiIdByIdentifier(apiServer, identifierDuoTou);
            let applyId = await helper.getApplyIdByApiId(applies, apiId);
            let worksheet2 = workbook.getWorksheet("多头借贷");
            await helper.writeDuoTouSheet(ctx, worksheet2, listParams, index, sendNumber, batchId, apiId, applyId, userId);
        }

        if (apisIdentifierArr.includes(identifierFanZui)) {
            let apiId = await helper.getApiIdByIdentifier(apiServer, identifierFanZui);
            let applyId = await helper.getApplyIdByApiId(applies, apiId);
            let worksheet3 = workbook.getWorksheet("犯罪不良");
            await helper.writeFanZuiSheet(ctx, worksheet3, listParams, index, sendNumber, batchId, apiId, applyId, userId);
        }

        if (apisIdentifierArr.includes(identifierGaoFa)) {
            let apiId = await helper.getApiIdByIdentifier(apiServer, identifierGaoFa);
            let applyId = await helper.getApplyIdByApiId(applies, apiId);
            let worksheet4 = workbook.getWorksheet("高法失信");
            startGaofa = await helper.writeGaoFaSheet(ctx, worksheet4, listParams, index, sendNumber, startGaofa, batchId, apiId, applyId, userId);
        }
        // console.log("startGaofa "+startGaofa);
        await workbook.xlsx.writeFile(filenameOut).then();
        let batchModel = ctx.model("batch_log");
        let batch = await batchModel.getRow({batch_id: batchId});
        finished = batch.finished;
        return finished;
    } catch (err) {
        console.log(err);
    }
}

/**
 * 更改多头标题
 * @param sheet
 * @returns {Promise.<void>}
 */
helper.titleDuoTouSheet = async function (sheet) {
    //合并单元格，构建标题
    sheet.mergeCells('E1', 'H1');
    sheet.mergeCells('A1', 'A2');
    sheet.mergeCells('B1', 'B2');
    sheet.mergeCells('C1', 'C2');
    sheet.mergeCells('D1', 'D2');
    sheet.getCell('E1').alignment = {vertical: 'middle', horizontal: 'center'};
    //设置sheet列名
    sheet.columns = [
        {header: '姓名', key: 'realName', width: 32},
        {header: '身份证', key: 'idCode', width: 32},
        {header: '手机号', key: 'phoneNumber', width: 32},
        {header: '是否命中', key: 'hit', width: 20},
        {header: '多头借贷信息', key: 'duo'},
    ];
    sheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'}
    };
    sheet.getCell('B1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('C1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('D1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('D2').value = '是否命中';
    sheet.getCell('E2').value = '信贷平台注册详情';
    sheet.getCell('F2').value = '贷款申请详情';
    sheet.getCell('G2').value = '贷款放款详情';
    sheet.getCell('H2').value = '贷款驳回详情';
}

/**
 * 更改金融逾期sheet
 * @param sheet
 * @returns {Promise.<void>}
 */
helper.titleJinRongSheet = async function (sheet) {
    //合并单元格，构建标题
    sheet.mergeCells('E1', 'M1');
    sheet.mergeCells('A1', 'A2');
    sheet.mergeCells('B1', 'B2');
    sheet.mergeCells('C1', 'C2');
    sheet.mergeCells('D1', 'D2');
    sheet.getCell('E1').alignment = {vertical: 'middle', horizontal: 'center'};
    //设置sheet列名
    sheet.columns = [
        {header: '姓名', key: 'realName', width: 32},
        {header: '身份证', key: 'idCode', width: 32},
        {header: '手机号', key: 'phoneNumber', width: 32},
        {header: '是否命中', key: 'jin'},
        {header: '金融信贷逾期', key: 'jin'},
    ];
    //设置标题颜色
    sheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'}
    };
    sheet.getCell('B1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('C1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('D1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('D2').value = '是否命中';
    sheet.getCell('E2').value = '逾期最早出现时间';
    sheet.getCell('F2').value = '逾期最近出现时间';
    sheet.getCell('G2').value = '逾期累计出现次数';
    sheet.getCell('H2').value = '当前逾期金额';
    sheet.getCell('I2').value = '当前逾期时长';
    sheet.getCell('J2').value = '历史最大逾期金额';
    sheet.getCell('K2').value = '历史最大逾期时长';
    sheet.getCell('L2').value = '欺诈最早出现时间';
    sheet.getCell('M2').value = '欺诈最近出现时间';
    sheet.getCell('N2').value = '欺诈累计出现次数';
}

/**
 * 更改犯罪不良标题
 * @param sheet
 * @returns {Promise.<void>}
 */
helper.titleFanZuiSheet = async function (sheet) {
    //合并单元格，构建标题
    sheet.mergeCells('A1', 'A2');
    sheet.mergeCells('B1', 'B2');
    sheet.mergeCells('C1', 'C2');
    sheet.mergeCells('D1', 'D2');
    sheet.mergeCells('E1', 'E2');
    sheet.getCell('E1').alignment = {vertical: 'middle', horizontal: 'center'};
    //设置sheet列名
    sheet.columns = [
        {header: '姓名', key: 'realName', width: 32},
        {header: '身份证', key: 'idCode', width: 32},
        {header: '手机号', key: 'phoneNumber', width: 32},
        {header: '是否命中', key: 'hit'},
        {header: '犯罪不良信息核查', key: 'fanzui', width: 32},
    ];
    //设置标题颜色
    sheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'}
    };
    sheet.getCell('B1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('C1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('D1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    // sheet.getCell('D1').value = '是否命中';
    // sheet.getCell('E1').value = '犯罪不良信息核查';
}

/**
 * 更改高法失信标题
 * @param sheet
 * @returns {Promise.<void>}
 */
helper.titleGaoFaSheet = async function (sheet) {
    //合并单元格，构建标题
    sheet.mergeCells('A1', 'A2');
    sheet.mergeCells('B1', 'B2');
    sheet.mergeCells('C1', 'C2');
    sheet.mergeCells('D1', 'D2');
    sheet.mergeCells('E1', 'K1');
    sheet.getCell('E1').alignment = {vertical: 'middle', horizontal: 'center'};
    //设置sheet列名
    sheet.columns = [
        {header: '姓名', key: 'realName', width: 32},
        {header: '身份证', key: 'idCode', width: 32},
        {header: '手机号', key: 'phoneNumber', width: 32},
        {header: '是否命中', key: 'hit'},
        {header: '高法失信被执行人', key: 'gaofa'},
    ];
    //设置标题颜色
    sheet.getCell('A1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'}
    };
    sheet.getCell('B1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('C1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    sheet.getCell('D1').fill = {
        type: 'pattern',
        pattern: 'mediumGray',
        fgColor: {argb: 'FFFFFF00'},
    };
    // sheet.getCell('D1').value = '是否命中';
    sheet.getCell('E2').value = '法院';
    sheet.getCell('F2').value = '省份';
    sheet.getCell('G2').value = '案件编号';
    sheet.getCell('H2').value = '执行状态';
    sheet.getCell('I2').value = '案件分类';
    sheet.getCell('J2').value = '立案日期';
    sheet.getCell('K2').value = '案件详情';
}

/**
 * 写入金融逾期sheet
 * @param sheet
 * @param listParams
 * @param index
 * @param sendNumber
 * @returns {Promise.<void>}
 */
helper.writeJinRongSheet = async function (ctx, sheet, listParams, index, sendNumber, batchId, apiId, applyId, user_id) {
    let geoApi = ctx.library("geo/api");
    let start = (index - 1) * sendNumber + 3;
    let funcs = ctx.library('func');
    for (let i = start; i < start + sendNumber && i < start + (listParams.length - 1) && i < listParams.length + 2; i++) {
        await helper.batchFinishedOne(ctx, batchId);
        let row = sheet.getRow(i);
        let group_id = listParams[i - 2].group_id;
        let params = {
            'realName': listParams[i - 2].realName,
            'idCode': listParams[i - 2].idCode,
            'phoneNumber': listParams[i - 2].phoneNumber
        }
        row.values = {
            realName: listParams[i - 2].realName,
            idCode: listParams[i - 2].idCode,
            phoneNumber: listParams[i - 2].phoneNumber
        };
        //参数校验
        if (await funcs.check_params(listParams[i - 2], 3) !== "success") {
            row.getCell(4).value = await funcs.check_params(listParams[i - 2],3);
            continue;
        }
        var result = {};
        var query_type = 0;
        var query_status = 0;
        var query = {
            identity_name: listParams[i - 2].realName,
            identity_code: listParams[i - 2].idCode,
            mobile: listParams[i - 2].phoneNumber
        };
        //构造query，先查本地库
        var queried = await funcs.isQueried(apiId, query, ctx);

        if (queried) {
            result = JSON.parse(queried.data);
            query_status = 1;
        } else {
            var oneResult = await geoApi.getJRYQResult(params);
            try {
                let oneJso = JSON.parse(oneResult);
                if(oneJso.data.RSL[0].RS.code=="-9999"){
                    result = oneJso.data.RSL[0].RS.desc ? oneJso.data.RSL[0].RS.desc : '';
                    query_status = 1;
                }
            } catch (e) {
            }
            if (result.result_xdpt == '') {
                result = {}
            }
        }

        //保存到查询历史
        if (query_status == 1) {
            await funcs.saveToQueryHistory(apiId, JSON.stringify(query), JSON.stringify(result), ctx);
        }

        //保存到查询日志
        await funcs.saveToQueryLog(user_id, apiId, applyId, batchId, group_id, JSON.stringify(query), query_type, JSON.stringify(result), query_status, ctx);


        if ("{}" != JSON.stringify(result)) {
            let rslJson = JSON.parse(result);
            let result_YQ_ZZSJ = rslJson.result_YQ_ZZSJ;
            let result_YQ_ZJSJ = rslJson.result_YQ_ZJSJ;
            let result_YQ_LJCS = rslJson.result_YQ_LJCS;
            let result_YQ_DQJE = rslJson.result_YQ_DQJE;
            let result_YQ_DQSC = rslJson.result_YQ_DQSC;
            let result_YQ_ZDJE = rslJson.result_YQ_ZDJE;
            let result_YQ_ZDSC = rslJson.result_YQ_ZDSC;
            let result_QZ_ZZSJ = rslJson.result_QZ_ZZSJ;
            let result_QZ_ZJSJ = rslJson.result_QZ_ZJSJ;
            let result_QZ_LJCS = rslJson.result_QZ_LJCS;
            row.getCell(5).value = result_YQ_ZZSJ == "" ? "-" : result_YQ_ZZSJ;
            row.getCell(6).value = result_YQ_ZJSJ == "" ? "-" : result_YQ_ZJSJ;
            row.getCell(7).value = result_YQ_LJCS == "" ? "-" : result_YQ_LJCS;
            row.getCell(8).value = result_YQ_DQJE == "" ? "-" : result_YQ_DQJE;
            row.getCell(9).value = result_YQ_DQSC == "" ? "-" : result_YQ_DQSC;
            row.getCell(10).value = result_YQ_ZDJE == "" ? "-" : result_YQ_ZDJE;
            row.getCell(11).value = result_YQ_ZDSC == "" ? "-" : result_YQ_ZDSC;
            row.getCell(12).value = result_QZ_ZZSJ == "" ? "-" : result_QZ_ZZSJ;
            row.getCell(13).value = result_QZ_ZJSJ == "" ? "-" : result_QZ_ZJSJ;
            row.getCell(14).value = result_QZ_LJCS == "" ? "-" : result_QZ_LJCS;
            row.getCell(4).value = "--匹配--"
        } else {
            row.getCell(4).value = "--未匹配--"
        }

    }

}

/**
 * 写入多头借贷结果
 * @param sheet
 * @param listParams
 * @param index
 * @param sendNumber
 * @returns {Promise.<void>}
 */
helper.writeDuoTouSheet = async function (ctx, sheet, listParams, index, sendNumber, batchId, apiId, applyId, user_id) {
    let geoApi = ctx.library("geo/api");
    let start = (index - 1) * sendNumber + 3;
    let funcs = ctx.library('func');
    for (let i = start; i < start + sendNumber && i < start + listParams.length - 1 && i < listParams.length + 2; i++) {
        await helper.batchFinishedOne(ctx, batchId);
        let row = sheet.getRow(i);
        let group_id = listParams[i - 2].group_id;
        let params = {
            'realName': listParams[i - 2].realName,
            'idCode': listParams[i - 2].idCode,
            'phoneNumber': listParams[i - 2].phoneNumber
        }

        row.values = {
            realName: listParams[i - 2].realName,
            idCode: listParams[i - 2].idCode,
            phoneNumber: listParams[i - 2].phoneNumber
        };
        //参数校验
        if (await funcs.check_params(listParams[i - 2], 3) !== "success") {
            row.getCell(4).value = await funcs.check_params(listParams[i - 2],3);
            continue;
        }
        var result = {};
        var query_type = 0;
        var query_status = 0;
        var query = {
            identity_name: listParams[i - 2].realName,
            identity_code: listParams[i - 2].idCode,
            mobile: listParams[i - 2].phoneNumber
        };
        //构造query，先查本地库
        var queried = await funcs.isQueried(apiId, query, ctx);

        if (queried) {
            result = JSON.parse(queried.data);
            query_status = 1;
        } else {
            var oneResult = await geoApi.getDTJDResult(params);
            try {
                let oneJson = JSON.parse(oneResult);
                if(oneJson.data.RSL[0].RS.code=="-9999"){
                    result = oneJson.data.RSL[0].RS.desc ? oneJson.data.RSL[0].RS.desc : '';
                    query_status = 1;
                }
            } catch (e) {
            }
            if (result.result_xdpt == '') {
                result = {}
            }
        }

        //保存到查询历史
        if (query_status == 1) {
            await funcs.saveToQueryHistory(apiId, JSON.stringify(query), JSON.stringify(result), ctx);
        }

        //保存到查询日志
        await funcs.saveToQueryLog(user_id, apiId, applyId, batchId, group_id, JSON.stringify(query), query_type, JSON.stringify(result), query_status, ctx);
        if ("{}" != JSON.stringify(result)) {
            let rslJsonD = JSON.parse(result);
            let zcxq = "";
            let dksq = "";
            let fkxq = "";
            let bhxq = "";
            if (rslJsonD.result_xdpt != null) {
                for (let i = 0; i < rslJsonD.result_xdpt.length; i++) {
                    if (i + 1 < rslJsonD.result_xdpt.length) {
                        zcxq += "平台类型:" + (rslJsonD.result_xdpt[i].P_TYPE == "1" ? "银行" : "非银行") + ",平台代码:" + rslJsonD.result_xdpt[i].PLATFORMCODE.replace("EMAY", "HMC").replace("GEO","HMC") +
                            ",注册时间:" + rslJsonD.result_xdpt[i].REGISTERTIME + ";"
                    } else {
                        zcxq += "平台类型:" + (rslJsonD.result_xdpt[i].P_TYPE == "1" ? "银行" : "非银行") + ",平台代码:" + rslJsonD.result_xdpt[i].PLATFORMCODE.replace("EMAY", "HMC").replace("GEO","HMC") +
                            ",注册时间:" + rslJsonD.result_xdpt[i].REGISTERTIME
                    }
                }
            }
            if (rslJsonD.result_dksq != null) {
                for (let i = 0; i < rslJsonD.result_dksq.length; i++) {
                    if (i + 1 < rslJsonD.result_dksq.length) {
                        dksq += "平台类型:" + (rslJsonD.result_dksq[i].P_TYPE == "1" ? "银行" : "非银行") + ",平台代码:" + rslJsonD.result_dksq[i].PLATFORMCODE.replace("EMAY", "HMC").replace("GEO","HMC") +
                            ",申请时间:" + rslJsonD.result_dksq[i].APPLICATIONTIME + ",申请金额区间:" + rslJsonD.result_dksq[i].APPLICATIONAMOUNT + ";"
                    } else {
                        dksq += "平台类型:" + (rslJsonD.result_dksq[i].P_TYPE == "1" ? "银行" : "非银行") + ",平台代码:" + rslJsonD.result_dksq[i].PLATFORMCODE.replace("EMAY", "HMC").replace("GEO","HMC") +
                            ",申请时间:" + rslJsonD.result_dksq[i].APPLICATIONTIME + ",申请金额区间:" + rslJsonD.result_dksq[i].APPLICATIONAMOUNT;
                    }
                }
            }

            if (rslJsonD.result_dkfk != null) {
                for (let i = 0; i < rslJsonD.result_dkfk.length; i++) {
                    if (i + 1 < rslJsonD.result_dkfk.length) {
                        fkxq += "平台类型:" + (rslJsonD.result_dkfk[i].P_TYPE == "1" ? "银行" : "非银行") + ",平台代码:" + rslJsonD.result_dkfk[i].PLATFORMCODE.replace("EMAY", "HMC").replace("GEO","HMC") +
                            ",放款时间:" + rslJsonD.result_dkfk[i].LOANLENDERSTIME + ",放款区间:" + rslJsonD.result_dkfk[i].LOANLENDERSAMOUNT + ";"
                    } else {
                        fkxq += "平台类型:" + (rslJsonD.result_dkfk[i].P_TYPE == "1" ? "银行" : "非银行") + ",平台代码:" + rslJsonD.result_dkfk[i].PLATFORMCODE.replace("EMAY", "HMC").replace("GEO","HMC") +
                            ",放款时间:" + rslJsonD.result_dkfk[i].LOANLENDERSTIME + ",放款区间:" + rslJsonD.result_dkfk[i].LOANLENDERSAMOUNT;
                    }
                }
            }

            if (rslJsonD.result_dkbh != null) {
                for (let i = 0; i < rslJsonD.result_dkbh.length; i++) {
                    if (i + 1 < rslJsonD.result_dkbh.length) {
                        bhxq += "平台类型:" + (rslJsonD.result_dkbh[i].P_TYPE == "1" ? "银行" : "非银行") + ",平台代码:" + rslJsonD.result_dkbh[i].PLATFORMCODE.replace("EMAY", "HMC").replace("GEO","HMC") +
                            ",驳回时间:" + rslJsonD.result_dkbh[i].REJECTIONTIME + ";"
                    } else {
                        bhxq += "平台类型:" + (rslJsonD.result_dkbh[i].P_TYPE == "1" ? "银行" : "非银行") + ",平台代码:" + rslJsonD.result_dkbh[i].PLATFORMCODE.replace("EMAY", "HMC").replace("GEO","HMC") +
                            ",驳回时间:" + rslJsonD.result_dkbh[i].REJECTIONTIME;
                    }
                }
            }

            row.getCell(4).value = "--匹配--";
            row.getCell(5).value = zcxq == "" ? "" : zcxq;
            row.getCell(6).value = dksq == "" ? "" : dksq;
            row.getCell(7).value = fkxq == "" ? "" : fkxq;
            row.getCell(8).value = bhxq == "" ? "" : bhxq;
        } else {
            row.getCell(4).value = "--未匹配--"
        }
    }

}

/**
 * 写入犯罪不良sheet
 * @param sheet
 * @param listParams
 * @param index
 * @param sendNumber
 * @returns {Promise.<void>}
 */
helper.writeFanZuiSheet = async function (ctx, sheet, listParams, index, sendNumber, batchId, apiId, applyId, user_id) {
    let xinyanApi = ctx.library("xinyan/api");
    let start = (index - 1) * sendNumber + 3;
    let funcs = ctx.library('func');
    for (let i = start; i < start + sendNumber && i < start + (listParams.length - 1) && i < listParams.length + 2; i++) {
        await helper.batchFinishedOne(ctx, batchId);
        let group_id = listParams[i - 2].group_id;
        let row = sheet.getRow(i);
        if (listParams[i - 2].phoneNumber == "" || listParams[i - 2].phoneNumber == undefined) {
            listParams[i - 2].phoneNumber = "";
        }
        let params = {
            'realName': listParams[i - 2].realName,
            'idCode': listParams[i - 2].idCode,
            'phoneNumber': listParams[i - 2].phoneNumber
        }

        row.values = {
            realName: listParams[i - 2].realName,
            idCode: listParams[i - 2].idCode,
            phoneNumber: listParams[i - 2].phoneNumber
        };
        //参数校验
        if (await funcs.check_params(listParams[i - 2], 2) !== "success") {
            row.getCell(4).value = await funcs.check_params(listParams[i - 2],2);
            continue;
        }
        var result = {};
        var query_type = 0;
        var query_status = 0;
        var query = {
            identity_name: listParams[i - 2].realName,
            identity_code: listParams[i - 2].idCode,
        };
        //构造query，先查本地库
        var queried = await funcs.isQueried(apiId, query, ctx);
        if (queried) {
            result = JSON.parse(queried.data);
            query_status = 1;
        } else {
            var fzRow = await xinyanApi.getFZResult(params)
            var fzRow = JSON.parse(fzRow)
            result = fzRow;
            if (fzRow.success && fzRow.data && fzRow.data.markResult && fzRow.data.markResult != '正常') {
                query_status = 1;
            }
        }
        //保存到查询历史
        if (query_status == 1) {
            await funcs.saveToQueryHistory(apiId, JSON.stringify(query), JSON.stringify(result), ctx);
        }

        //保存到查询日志
        await funcs.saveToQueryLog(user_id, apiId, applyId, batchId, group_id, JSON.stringify(query), query_type, JSON.stringify(result), query_status, ctx);
        let oneJson = JSON.stringify(result);

        if ("{}" != oneJson && JSON.parse(oneJson).data != null) {
            let rsl = JSON.parse(oneJson).data;
            let markResult = rsl.markResult;
            row.getCell(5).value = markResult == "" ? "" : markResult;
            if (markResult != "正常") {
                row.getCell(4).value = "--匹配--";
            } else {
                row.getCell(4).value = "--未匹配--"
            }
        } else {
            row.getCell(4).value = "--未匹配--"
        }
    }

}

/**
 * 写入高法失信sheet
 * @param sheet
 * @param listParams
 * @param index
 * @param sendNumber
 * @returns {Promise.<void>}
 */
helper.writeGaoFaSheet = async function (ctx, sheet, listParams, index, sendNumber, startGaofa, batchId, apiId, applyId, user_id) {
    let zhongqingApi = ctx.library("zhongqing/api");
    let funcs = ctx.library('func')
    let indexInList = (index - 1) * sendNumber + 1;
    for (let i = 0; i < sendNumber; i++) {
        if (listParams[indexInList + i] != undefined) {
            let startRow = (index - 1) * sendNumber + 3 + startGaofa;
            let rowNumber = startRow + i;
            await helper.batchFinishedOne(ctx, batchId);
            let group_id = listParams[indexInList + i].group_id;
            let params = {
                'realName': listParams[indexInList + i].realName,
                'idCode': listParams[indexInList + i].idCode,
            }

            let row0 = sheet.getRow(rowNumber);
            //参数校验
            if (await funcs.check_params(listParams[indexInList + i], 2) !== "success") {
                row0.values = {
                    realName: listParams[indexInList + i].realName,
                    idCode: listParams[indexInList + i].idCode,
                    phoneNumber: listParams[indexInList + i].phoneNumber
                };
                row0.getCell(4).value = await funcs.check_params(listParams[indexInList + i],2);
                continue;
            }

            var result = {};

            var query_type = 0;
            var query_status = 0;
            var query = {
                identity_name: listParams[indexInList + i].realName,
                identity_code: listParams[indexInList + i].idCode
            };
            //是否已经查询过
            var queried = await funcs.isQueried(apiId, query, ctx);

            if (queried) {
                result = JSON.parse(queried.data);
                query_status = 1;
            } else {
                var oneRe = await zhongqingApi.getGaoFaResult(ctx, params);
                if (JSON.stringify(oneRe) !== "{}") {
                    result = oneRe;
                    query_status = 1;
                }
            }

            //保存到查询历史
            if (query_status == 1) {
                await funcs.saveToQueryHistory(apiId, JSON.stringify(query), JSON.stringify(result), ctx)
            }

            //保存到查询日志
            await funcs.saveToQueryLog(user_id, apiId, applyId, batchId, group_id, JSON.stringify(query), query_type, JSON.stringify(result), query_status, ctx)

            let oneResult = await zhongqingApi.getGaoFaResult(ctx, params);

            if (JSON.stringify(oneResult) != '{}') {
                startGaofa = startGaofa + oneResult.length - 1;
                for (let j = 0; j < oneResult.length; j++) {
                    let row = sheet.getRow(rowNumber + j);
                    row.values = {
                        realName: listParams[indexInList + i].realName,
                        idCode: listParams[indexInList + i].idCode,
                        phoneNumber: listParams[indexInList + i].phoneNumber
                    };

                    let court = oneResult[j].court;
                    let province = oneResult[j].province;
                    let case_no = oneResult[j].case_no;
                    let status = oneResult[j].status;
                    let memo = oneResult[j].memo;
                    let case_date = oneResult[j].case_date;
                    let obligation = oneResult[j].obligation;
                    row.getCell(5).value = court == "" ? "" : court;
                    row.getCell(6).value = province == "" ? "" : province;
                    row.getCell(7).value = case_no == "" ? "" : case_no;
                    row.getCell(8).value = status == "" ? "" : status;
                    row.getCell(9).value = memo == "" ? "" : memo;
                    row.getCell(10).value = case_date == "" ? "" : case_date;
                    row.getCell(11).value = obligation == "" ? "" : obligation;
                    row.getCell(4).value = "--匹配--"
                }

            } else {
                let row = sheet.getRow(rowNumber);
                row.values = {
                    realName: listParams[indexInList + i].realName,
                    idCode: listParams[indexInList + i].idCode,
                    phoneNumber: listParams[indexInList + i].phoneNumber
                };
                row.getCell(4).value = "--未匹配--"
            }
        } else {
            continue;
        }
    }
    return await startGaofa;
}

helper.getApiIdByIdentifier = function (apiServer, identifier) {
    let apiId = "";
    apiServer.forEach(function (api) {
        if (identifier == api.identifier) {
            apiId = api._id;
        }
    })
    return apiId;
}

helper.getApplyIdByApiId = function (applies, apiId) {
    let applyId = "";
    applies.forEach(function (apply) {
        if (apiId == apply.api_id) {
            applyId = apply._id;
        }
    })
    return applyId
}

helper.batchFinishedOne = async function (ctx, batchId) {
    let batchModel = ctx.model("batch_log");
    // let batch = await batchModel.getRow({batch_id:batchId});
    await batchModel.updateRow({batch_id: batchId}, {$inc: {finished: 1}})
}
