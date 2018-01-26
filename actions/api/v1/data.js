module.exports = function ($) {

    // 高法失信
    $.get('/api/v1/api1', async (ctx, next) => {
        var self = ctx;
        var _params = self.request.query;
        var user_id = _params.user_id;
        var apply_id = _params.apply_id;
        var group_id = _params.group_id;
        var identity_name = _params.identity_name;
        var identity_code = _params.identity_code;
        var mobile = _params.mobile;

        var funcs = self.library('func')

        // 判断API是否存在
        var apiModel = self.model('api');
        var api = await apiModel.getRow({
            'uri': '/api/v1/api1'
        });
        if (!api) {
            self.status = 404;
            self.body = 'API不存在';
            return;
        }

        //检查API权限
        var api_id = api._id;
        if (!await funcs.check_api(user_id, api_id, self)) {
            self.status = 403;
            self.body = 'API未授权';
            return;
        }

        //检查余额
        if (!await funcs.check_balance(user_id, apply_id, self)) {
            self.status = 403;
            self.body = '余额不足';
            return;
        }


        self.status = 200;
        var result = {};

        var query_type = 0;
        var query_status = 0;
        var query = {
            identity_name: identity_name,
            identity_code: identity_code
        };

        //是否已经查询过
        var queried = await funcs.isQueried(api_id, query, self);

        if (queried) {
            result = JSON.parse(queried.data);
            query_status = 1;
        } else {
            var personInfoModel = self.model('person_info');
            var row = await personInfoModel.getRow({
                'entity_name': identity_name,
                'identify_code': identity_code
            })
            if (row) {
                result = row.data[0].sp;
                query_status = 1;
            }
        }

        //保存到查询历史
        if (query_status == 1) {
            await funcs.saveToQueryHistory(api_id, JSON.stringify(query), JSON.stringify(result), self)
        }

        //保存到查询日志
        await funcs.saveToQueryLog(user_id, api_id, apply_id, '', group_id, JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)

        self.body = result;
    });

    // 金融逾期
    $.get('/api/v1/api2', async (ctx, next) => {
        var self = ctx;
        var _params = self.request.query;
        var user_id = _params.user_id;
        var apply_id = _params.apply_id;
        var group_id = _params.group_id;
        var identity_name = _params.identity_name;
        var identity_code = _params.identity_code;
        var mobile = _params.mobile;
        var funcs = self.library('func')

        // 判断API是否存在
        var apiModel = self.model('api');
        var api = await apiModel.getRow({
            'uri': '/api/v1/api2'
        });
        if (!api) {
            self.status = 404;
            self.body = 'API不存在';
            return;
        }

        //检查API权限
        var api_id = api._id;
        if (!await funcs.check_api(user_id, api_id, self)) {
            self.status = 403;
            self.body = 'API未授权';
            return;
        }

        //检查余额
        if (!await funcs.check_balance(user_id, apply_id, self)) {
            self.status = 403;
            self.body = '余额不足';
            return;
        }

        self.status = 200;
        var result = {};
        //检查参数
        if (mobile == "") {
            self.body = result;
            return;
        }
        var query_type = 0;
        var query_status = 0;

        var query = {
            identity_name: identity_name,
            identity_code: identity_code,
            mobile: mobile
        };

        //是否已经查询过
        var queried = await funcs.isQueried(api_id, query, self);

        if (queried) {
            result = JSON.parse(queried.data);
            query_status = 1;
        } else {
            var geoApi = self.library("geo/api");
            var row = await geoApi.getJRYQResult({
                'realName': identity_name,
                'idCode': identity_code,
                'phoneNumber': mobile,
            });

            try {
                row = JSON.parse(row);
                if (row.data.RSL[0].RS.code == "-9999") {
                    result = row.data.RSL[0].RS.desc ? row.data.RSL[0].RS.desc : '';
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
            await funcs.saveToQueryHistory(api_id, JSON.stringify(query), JSON.stringify(result), self)
        }

        //保存到查询日志
        await funcs.saveToQueryLog(user_id, api_id, apply_id, '', group_id, JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)

        self.body = result;
    });

    // 犯罪信息
    $.get('/api/v1/api3', async (ctx, next) => {
        var self = ctx;

        var _params = self.request.query;
        var user_id = _params.user_id;
        var apply_id = _params.apply_id;
        var group_id = _params.group_id;
        var identity_name = _params.identity_name;
        var identity_code = _params.identity_code;
        var mobile = _params.mobile;

        var funcs = self.library('func')

        // 判断API是否存在
        var apiModel = self.model('api');
        var api = await apiModel.getRow({
            'uri': '/api/v1/api3'
        });
        if (!api) {
            self.status = 404;
            self.body = 'API不存在';
            return;
        }

        //检查API权限
        var api_id = api._id;
        if (!await funcs.check_api(user_id, api_id, self)) {
            self.status = 403;
            self.body = 'API未授权';
            return;
        }

        //检查余额
        if (!await funcs.check_balance(user_id, apply_id, self)) {
            self.status = 403;
            self.body = '余额不足';
            return;
        }

        self.status = 200;
        var result = {};

        var query_type = 0;
        var query_status = 0;

        var query = {
            identity_name: identity_name,
            identity_code: identity_code,
        }


        //是否已经查询过
        var queried = await funcs.isQueried(api_id, query, self);

        if (queried) {
            result = JSON.parse(queried.data);
            query_status = 1;
        } else {
            try {

                var xinyanApi = self.library("xinyan/api");
                var row = await xinyanApi.getFZResult({
                    'realName': identity_name,
                    'idCode': identity_code,
                    'phoneNumber': mobile,
                })
                var row = JSON.parse(row)

                result = row;
                if (row.success && row.data && row.data.markResult && row.data.markResult != '正常') {
                    query_status = 1;
                }
            } catch (err) {
                console.log(err);
            }
        }

        //保存到查询历史
        if (query_status == 1) {
            await funcs.saveToQueryHistory(api_id, JSON.stringify(query), JSON.stringify(result), self)
        }

        //保存到查询日志
        await funcs.saveToQueryLog(user_id, api_id, apply_id, '', group_id, JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)

        self.body = result;
    });

    // 多头借贷
    $.get('/api/v1/api4', async (ctx, next) => {
        var self = ctx;

        var _params = self.request.query;
        var user_id = _params.user_id;
        var apply_id = _params.apply_id;
        var group_id = _params.group_id;
        var identity_name = _params.identity_name;
        var identity_code = _params.identity_code;
        var mobile = _params.mobile;

        var funcs = self.library('func')

        // 判断API是否存在
        var apiModel = self.model('api');
        var api = await apiModel.getRow({
            'uri': '/api/v1/api4'
        });
        if (!api) {
            self.status = 404;
            self.body = 'API不存在';
            return;
        }

        //检查API权限
        var api_id = api._id;
        if (!await funcs.check_api(user_id, api_id, self)) {
            self.status = 403;
            self.body = 'API未授权';
            return;
        }

        //检查余额
        if (!await funcs.check_balance(user_id, apply_id, self)) {
            self.status = 403;
            self.body = '余额不足';
            return;
        }

        self.status = 200;
        var result = {};
        //检查参数
        if (mobile == "") {
            self.body = result;
            return;
        }
        var query_type = 0;
        var query_status = 0;
        var query = {
            identity_name: identity_name,
            identity_code: identity_code,
            mobile: mobile
        }

        //是否已经查询过
        var queried = await funcs.isQueried(api_id, query, self);

        if (queried) {
            result = JSON.parse(queried.data);
            query_status = 1;
        } else {
            var geoApi = self.library("geo/api");
            var row = await geoApi.getDTJDResult({
                'realName': identity_name,
                'idCode': identity_code,
                'phoneNumber': mobile,
            });

            try {
                row = JSON.parse(row);
                if (row.data.RSL[0].RS.code == "-9999") {
                    result = row.data.RSL[0].RS.desc ? row.data.RSL[0].RS.desc : '';
                    query_status = 1;
                }
            } catch (e) {
            }
        }

        //保存到查询历史
        if (query_status == 1) {
            await funcs.saveToQueryHistory(api_id, JSON.stringify(query), JSON.stringify(result), self)
        }

        //保存到查询日志
        await funcs.saveToQueryLog(user_id, api_id, apply_id, '', group_id, JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)

        self.body = result;
    });

    //企业查询
    $.get("/api/v1/enterprise", async (ctx, next) => {
        var self = ctx;
        var _params = self.request.query;
        var user_id = _params.user_id;
        var apply_id = _params.apply_id;
        var group_id = _params.group_id;
        var ent_name = _params.identity_name;
        var credit_no = _params.identity_code;
        var funcs = self.library('func')
        // 判断API是否存在
        var apiModel = self.model('api');
        var api = await apiModel.getRow({
            'uri': '/api/v1/enterprise'
        });
        if (!api) {
            self.status = 404;
            self.body = 'API不存在';
            return;
        }
        //检查API权限
        var api_id = api._id;
        if (!await funcs.check_api(user_id, api_id, self)) {
            self.status = 403;
            self.body = 'API未授权';
            return;
        }
        //检查余额
        if (!await funcs.check_balance(user_id, apply_id, self)) {
            self.status = 403;
            self.body = '余额不足';
            return;
        }
        self.status = 200;
        var result = {};
        var query_type = 1;
        var query_status = 0;
        var queryParms = {}
        if (ent_name) {
            queryParms.ent_name = ent_name
        }
        if (credit_no) {
            queryParms.credit_no = credit_no
        }
        var query = {}
        var entInfoModel = self.model('ent_info');
        var row = await entInfoModel.getRow(queryParms);
        if (row) {


        } else {


        }


        //查询更新企业基本信息
        var upDataRow = await  entInfoModel.updateOrInsertRow(queryParms, _params_updata);

        var row = await entInfoModel.getRow(queryParms);
        if (row) {
            query.identity_name = row.ent_name
            query.identity_code = row.credit_no
            result = row;
            query_status = 1;
        } else {
            if (ent_name) {
                query.identity_name = ent_name
            }
            if (credit_no) {
                query.identity_code = credit_no
            }
        }
        //保存到查询日志
        await funcs.saveToQueryLog(user_id, api_id, apply_id, '', group_id, JSON.stringify(query), query_type, JSON.stringify(result), query_status, self)

        self.body = result;
    });
    $.get('/share/test', async (ctx, next) => {
        var str = await  constructPrams(ctx, '星月网吧')
        var entInfoModel = ctx.model('ent_info');
        var row = await  entInfoModel.updateOrInsertRow({'ent_name':'星月网吧'},str)
        ctx.body = row
    });

    async function constructPrams(ctx, ent_name, credit_no) {
        //   var   http  =require('/libraries/creditchina/api');
        var http = ctx.library('creditchina/api')
        var basicInfo = await http.getBasicInfo(ent_name, credit_no);
        basicInfo_result = JSON.parse(basicInfo).results
        info = basicInfo_result[0]
        var basicRecord = await  http.getRecord(ent_name, credit_no)
        basicRecord_result = JSON.parse(basicRecord).results
        record = basicRecord_result[0]

        var basicPubPenalty = await  http.getPubPenalty(ent_name, credit_no)
        basicPubPenalty_result = JSON.parse(basicPubPenalty).results
        pubPenalty = basicPubPenalty_result[0]


        console.log(basicPubPenalty);

        _params_updata = {
            ent_info: {
                reg_time: info.esdate,
                reg_address: '',
                biz_period: '',
                ent_status: info.entstatus,
                legal_man: info.legalperson,
                reg_capital: info.area,
                dl_flag: '',
                permition_no: '',
                ent_type: info.enttype,
                auth_date: info.opfrom,
                reg_org: info.regorg,
                biz_scope: info.opscope,
                biz_address: info.dom,
                create_date: Date.now(),
                industry_type: ''
            },
            data:
                [{
                    ag: [{
                        "case_no": "",
                        "case_name": "",
                        "pun_type": "",
                        "illegal_entity": "",
                        "pun_date": "",
                        "pun_org": "",
                        "pun_dept": "",
                        "pun_reason": "",
                        "pun_by": "",
                        "pun_result": "",
                        "create_date": "",
                        "update_date": "",
                        "del_flag": ""
                    }]
                },
                    {
                        cb: [{
                            "title": "",
                            "case_no": "",
                            "org_level": "",
                            "case_fact": "",
                            "law_item": "",
                            "decision": "",
                            "pun_org": "",
                            "pun_date": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {
                        ci: [{
                            "title": "",
                            "case_no": "",
                            "pub_date": "",
                            "org_level": "",
                            "content": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {
                        cm: [{
                            "pun_date": "",
                            "pun_reason": "",
                            "pun_content": "",
                            "pun_org": "",
                            "case_no": "",
                            "effective_date": "",
                            "link": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {
                        cs: [{
                            "title": "", "case_no": "", "pun_date": "", "pun_org": "", "org_level": "", "pun_type": "",
                            "pun_content": "", "create_date": "", "update_date": "", "del_flag": ""
                        }]
                    },
                    {cu: [{"create_date": "", "update_date": "", "del_flag": ""}]},
                    {dp: [{"create_date": "", "update_date": "", "del_flag": ""}]},
                    {
                        fm: [{
                            "medicine_certno": "",
                            "title": "",
                            "check_reason": "",
                            "check_org": "",
                            "check_time": "",
                            "pub_date": "",
                            "pub_mode": "",
                            "problem": "",
                            "operation": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {
                        gp: [{
                            "pun_content": "",
                            "pun_result": "",
                            "pun_by": "",
                            "pun_date": "",
                            "gist_unit": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {
                        mt: [{
                            "pun_content": "",
                            "pun_result": "",
                            "pun_by": "",
                            "pun_date": "",
                            "gist_unit": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {
                        oe: [{
                            "pun_org": "",
                            "report_year": "",
                            "pun_date": "",
                            "pun_reason": "",
                            "case_no": "",
                            "op_flag": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {qb: [{"time": "", "link": "", "create_date": "", "update_date": "", "del_flag": ""}]},
                    {
                        sb: [{
                            "pun_date": "",
                            "acc_ent": "",
                            "death_num": "",
                            "acc_content": "",
                            "info_source": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {
                        sp: [{
                            "case_id": "",
                            "court": "",
                            "province": "",
                            "case_no": "",
                            "status": "",
                            "memo": "",
                            "pub_date": "",
                            "obligation": "",
                            "case_date": "",
                            "gist_id": "",
                            "gist_unit": "",
                            "performed_part": "",
                            "unperform_part": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {
                        tr: [{
                            "permit_no": "",
                            "pun_reason": "",
                            "pun_content": "",
                            "pun_by": "",
                            "start_time": "",
                            "end_time": "",
                            "description": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": ""
                        }]
                    },
                    {
                        ta: [{
                            "tax_type": "",
                            "tax_balance": "",
                            "current_amount": "",
                            "create_date": "",
                            "update_date": "",
                            "del_flag": "",
                            "tax_org": "",
                            "data_source": "",
                            "file_name": "",
                            "pub_date": ""
                        }]
                    },
                    {
                        ap: [{
                            case_no: pubPenalty?pubPenalty.cf_wsh:'',
                            punish_name: pubPenalty?pubPenalty.cf_cfmc:'',
                            punish_type1: pubPenalty?pubPenalty.cf_cflb1:'',
                            punish_type2: pubPenalty?pubPenalty.cf_cflb2:'',
                            punish_reason: pubPenalty?pubPenalty.cf_sy:'',
                            punish_finish_date: '',
                            law_item: pubPenalty?pubPenalty.cf_yj:'',
                            punish_result: pubPenalty?pubPenalty.cf_jg:'',
                            punish_date: pubPenalty?pubPenalty.cf_jdrq:'',
                            punish_agent: pubPenalty?pubPenalty.cf_xzjg:'',
                            punish_period: '',
                            current_status: pubPenalty?pubPenalty.cf_zt:'',
                            offical_updtime: pubPenalty?pubPenalty.sjc:'',
                            note: pubPenalty?pubPenalty.bz:'',
                            create_date: Date.now(),
                            update_date: '',
                            del_flag: ''
                        }]
                    }
                ],
            created: Date.now(),
            ent_score: 0,
            org_no: record.orgCode,
            reg_no: record.regCode,
            ent_name: record.entName,
            credit_no: record.credCode,
            tax_code: record.taxCode
        }
        _params_updata['data'][16]['ap']
        return _params_updata
    }

}
