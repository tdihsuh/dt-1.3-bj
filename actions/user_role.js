module.exports = function($) {

  //角色
  $.get("/user_roles", async (ctx, next) => {
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

    var roleModel = self.model("user_role");

    var totalPage = 0;
    var count = await roleModel.getRowsCount(params);
    if (count) {
      totalPage = Math.ceil(count / limit);
    }

    var rows = await roleModel.getPagedRows(params, offset, limit, {
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

    result.title =  '用户类型';

    var common = self.library("common");
    result.common = common;

    await self.render('/users/roles', result);
  });

  //创建角色
  $.post("/user_roles", async (ctx, next) => {
    var self = ctx;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    //创建
    var roleModel = self.model("user_role");
    var isSuccess = await roleModel.createRow(_params);

    if (isSuccess) {
      status = 201;
    } else {
      result = "更新失败!";
      status = 400;
    }

    self.status = status;
    self.body = result;
  });

  //编辑角色
  $.put("/user_roles/:_id", async (ctx, next) => {
    var _id = self.params._id;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    var roleModel = self.model("user_role");
    var isSuccess = await roleModel.findOneAndUpdateRow({
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

  //角色信息
  $.get("/users/roles/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;

    var status = 200;
    var result = {};
    var roleModel = self.model("user_role");
    var userRole = await roleModel.getRow({ _id: _id });
    if (userRole) {
      status = 200;
      result = userRole;
    } else {
      status = 404;
    }
    self.status = status;
    self.body = result;
  });

  //删除角色
  $.delete("/users/roles/:_id", async (ctx, next) => {
    var self = ctx;
    var result = {};

    var _id = self.params._id;

    var roleModel = self.model("user_role");
    var isSuccess = await roleModel.deleteRow({
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
