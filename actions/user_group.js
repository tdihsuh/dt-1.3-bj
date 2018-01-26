module.exports = function($) {

  //行业类型
  $.get("/user_groups", async (ctx, next) => {
    var self = ctx;

    //admin 角色才可访问
    if (!self.session.user || !(self.session.user_type == 'admin')) {
      self.redirect('/login');
      return;
    }

    var _params = self.request.query;
    var params = {};
    var result = {};
    var status = 200;

    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    var name = _params["name"] ? _params["name"] : "";
    if (name != '') {
      params.name = new RegExp(name, 'i');
    }

    var result = {};
    var status = 200;

    var userGroupModel = self.model("user_group");

    var totalPage = 0;
    var count = await userGroupModel.getRowsCount(params);
    if (count) {
      totalPage = Math.ceil(count / limit);
    }

    var rows = await userGroupModel.getPagedRows(params, offset, limit, {
      created: -1
    });

    if (rows) {
      result = {
        rows: rows,
        name: name,
        offset: offset,
        limit: limit,
        totalPage: totalPage
      };
    } else {
      status = 400;
    }

    result.title =  '行业类型';

    var common = self.library("common");
    result.common = common;

    await self.render('/users/groups', result);
  });


  //创建客户标签
  $.post("/user_groups", async (ctx, next) => {
    var self = ctx;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    //创建
    var userGroupModel = self.model("user_group");
    var isSuccess = await userGroupModel.createRow(_params);
    if (isSuccess) {
      status = 201;
    } else {
      result = "更新失败!";
      status = 400;
    }

    self.status = status;
    self.body = result;
  });


  //编辑客户标签
  $.put("/user_groups/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    var userGroupModel = self.model("user_group");
    var isSuccess = await userGroupModel.findOneAndUpdateRow({
      _id: _id
    }, _params);

    if (isSuccess) {
      status = 201;
    } else {
      result = "更新失败!";
      status = 400;
    }

    self.status = status;
    self.body = result;
  });


  //客户标签信息
  $.get("/user_groups/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;

    var status = 200;
    var result = {};
    var userGroupModel = self.model("user_group");
    var userGroup = await userGroupModel.getRow({ _id: _id });
    if (userGroup) {
      status = 200;
      result = userGroup;
    } else {
      status = 404;
    }

    self.status = status;
    self.body = result;
  });


  //删除客户标签
  $.delete("/user_groups/:_id", async (ctx, next) => {
    var self = ctx;
    var result = {};

    var _id = self.params._id;

    var userGroupModel = self.model("user_group");
    var isSuccess = await userGroupModel.deleteRow({
      _id: _id
    });

    if (isSuccess) {
      status = 201;
    } else {
      result = "操作失败!";
      status = 400;
    }

    self.status = status;
    self.body = result;
  });

};
