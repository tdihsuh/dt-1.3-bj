module.exports = function($) {

  //角色
  $.get("/admin_roles", async (ctx, next) => {
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

    var adminRoleModel = self.model("admin_role");

    var totalPage = 0;
    var count = await adminRoleModel.getRowsCount(params);
    if (count) {
      totalPage = Math.ceil(count / limit);
    }

    var rows = await adminRoleModel.getPagedRows(params, offset, limit, {
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

    result.title = '管理员角色';

    var common = self.library("common");
    result.common = common;

    await self.render('/admins/roles', result);
  });

  //创建角色
  $.post("/admin_roles", async (ctx, next) => {
    var self = ctx;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    //创建
    var adminRoleModel = self.model("admin_role");
    var isSuccess = await adminRoleModel.createRow(_params);
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
  $.put("/admin_roles/:_id", async (ctx, next) => {
    var _id = self.params._id;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    var adminRoleModel = self.model("admin_role");
    var isSuccess = await adminRoleModel.findOneAndUpdateRow({
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
  $.get("/admin_roles/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;

    var status = 200;
    var result = {};
    var adminRoleModel = self.model("admin_role");
    var row = await adminRoleModel.getRow({
      _id: _id
    });
    if (row) {
      status = 200;
      result = row;
    } else {
      status = 404;
    }
    self.status = status;
    self.body = result;
  });

  //删除角色
  $.delete("/admin_roles/:_id", async (ctx, next) => {
    var self = ctx;
    var result = {};

    var _id = self.params._id;

    var adminRoleModel = self.model("admin_role");
    var isSuccess = await adminRoleModel.deleteRow({
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
