module.exports = function ($) {
    //版本升级
    $.get("/messages", async (ctx, next) => {
        var self = ctx;
        //admin 角色才可访问
        if (!self.session.user || !(self.session.user_type == 'admin')) {
            self.redirect('/login');
            return;
        }
        var _params = self.request.query;
        var offset = _params.offset ? _params.offset : 0;
        var limit = _params.limit ? _params.limit : config.get("limit");
        var result = {}
        var status = 200;
        var params = {}
        var nowTime=Date.now();
        var from = _params.from ? _params.from : "";
        var to = _params.to ? _params.to : "";
        var message_type = _params.message_type ? _params.message_type : "";
        //获取消息列表
        var messageModel = self.model("message");
        var totalPage = 0;
        var count = await messageModel.getRowsCount(params);
        if (count) {
            totalPage = Math.ceil(count / limit);
        }
        var rows = await messageModel.getPagedRows(params, offset, limit, {
            created: -1
        });
        if (rows) {
            result = {
                rows: rows,
                offset: offset,
                limit: limit,
                totalPage: totalPage,
                message_type: message_type,
                from: from,
                to: to
            };
            for (let i = 0; i < rows.length; i++) {
                if (nowTime < rows[i]['to']&&nowTime>rows[i]['from'] ) {
                    rows[i]['status']=1 //生效
                }else if (nowTime> rows[i]['to']){
                    rows[i]['status']=0//已过期
                }else {
                    rows[i]['status']=2 //未生效
                }
            }
        } else {

        }
        var common = self.library("common");
        result.common = common;
        result.title = '版本升级提示';
        await self.render('messages/messages', result);
    });

    //插入消息提醒
    $.post("/add_message", async (ctx, next) => {
        var self = ctx;
        let _params = self.request.fields;

        var target= self.request.fields.target;
        var from =self.request.fields.from;
        var to =self.request.fields.to;
        var messageModel = self.model("message");
        var rows = await  messageModel.getRows({target:target});
        if (rows) {
            for (let i = 0; i < rows.length; i++) {
                if (_params.created==rows[i].created){
                    continue
                }

                if(from>rows[i]['to']||to<rows[i]['from']){

                }else {
                    self.status = 403;
                    self.body={message:'时间范围有重叠, 请编辑之前升级提示'};
                    return
                }
            }
        }

        var row = await messageModel.updateOrInsertRow({created:_params.created},_params)
        if (row) {
            self.status = 200;
            self.body = {
                row: row,
                code: 200,
                message: '添加成功'
            }
        } else {
            self.status = 403;
            self.body = {
                code: 400,
                message: '添加失败'
            }
        }
    });

    $.get("/messages/:_id", async (ctx, next) => {
        var self = ctx;
        var _id = self.params._id;
        //获取消息列
        var messageModel = self.model("message");
        var row = await messageModel.getRow({'_id':_id});
        if (row) {
            status = 200;
            result = row;
        } else {
            status = 404;
        }
        self.status = status;
        self.body = result;
    });
    //删除提醒
    $.delete("/messages/:_id", async (ctx, next) => {
        var self = ctx;
        var _id = self.params._id;
        //获取消息列
        var messageModel = self.model("message");
        var row = await messageModel.deleteRow({'_id':_id});
        if (row) {
            status = 200;
            result = row;
        } else {
            status = 404;
        }
        self.status = status;
        self.body = result;
    });



};
