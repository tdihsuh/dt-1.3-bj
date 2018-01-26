module.exports = function($) {

  //用户列表
  $.get("/admins", async (ctx, next) => {
    var self = ctx;

    //admin 角色才可访问
    if (!self.session.user || !(self.session.user_type == 'admin')) {
      self.redirect('/login');
      return;
    }

    var _params = self.request.query;
    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");

    var result = {};
    var status = 200;

    var params = {};

    var role = _params["role"] && _params["role"] !== "all" ? _params["role"] : "";
    if (role != '') {
      params.role = new RegExp(role, 'i');
    }

    var adminModel = self.model("admin");
    var roleModel = self.model("admin_role");


    var totalPage = 0;
    var count = await adminModel.getRowsCount(params);
    if (count) {
      totalPage = Math.ceil(count / limit);
    }

    var rows = await adminModel.getPagedRows(params, offset, limit, {
      created: -1
    });

    if (rows) {
      result = {
        rows: rows,
        role: role,
        offset: offset,
        limit: limit,
        totalPage: totalPage
      };
    } else {
      status = 400;
    }

    //获取角色
    var roles = await roleModel.getRows({});
    if (roles) {
      result.roles = roles;
    } else {
      result.roles = [];
    }

    var common = self.library("common");
    result.common = common;
    result.title = '管理员列表';
    await self.render('admins/admins', result);
  });

  //创建用户
  $.post("/admins", async (ctx, next) => {
    var self = ctx;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    //创建
    var userModel = self.model("admin");
    var isExist = await userModel.getRow({
      username: _params.username
    });

    if (isExist) {
      status = 400;
      result = "用户名已经存在！";
    } else {
      var isSuccess = await userModel.createRow(_params);
      if (isSuccess) {
        status = 201;
      } else {
        result = "创建失败!";
        status = 400;
      }
    }

    self.status = status;
    self.body = result;
  });

  //编辑用户
  $.put("/admins/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    var adminModel = self.model("admin");
    var admin = await adminModel.getRow({
      username: _params.username,
      _id: {
        $ne: _id
      }
    });
    if (admin) {
      status = 400;
      result = "用户名已经存在！";
    } else {
      var isSuccess = adminModel.findOneAndUpdateRow({
        _id: _id
      }, _params);

      if (isSuccess) {
        status = 201;
      } else {
        result = "更新失败!";
        status = 400;
      }
    }

    self.status = status;
    self.body = result;
  });

  //用户信息
  $.get("/admins/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;

    var status = 200;
    var result = {};
    var adminModel = self.model("admin");
    var admin = await adminModel.getRow({
      _id: _id
    });
    if (admin) {
      status = 200;
      result = admin;
    } else {
      status = 404;
    }
    self.status = status;
    self.body = result;
  });

  //删除用户
  $.delete("/admins/:_id", async (ctx, next) => {
    var self = ctx;
    var result = {};

    var _id = self.params._id;

    var adminModel = self.model("admin");
    var isSuccess = await adminModel.deleteRow({
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

  //初始化用户密码
  $.put("/admins/init/password/:id", async (ctx, next) => {
    var self = ctx;

    //admin 角色才可访问
    if (!self.session.user || !(self.session.user_type == 'admin')) {
      self.redirect('/login');
      return;
    }

    var id = self.params.id;

    var status = 200;
    var result = {};
    var crypto = require('crypto');
    var md5 = crypto.createHash('md5');
    md5.update('666666', 'utf8');
    var password = md5.digest('hex');

    var adminModel = self.model("admin");
    var isSuccess = await adminModel.findOneAndUpdateRow({
      _id: id
    }, {
      "password": password
    });
    if (isSuccess) {
      result = {
        "code": "20000",
        "msg": "密码初始化成功,默认密码666666，请尽快修改初始密码！"
      }
    } else {
      status = 400;
      result = {
        "code": "20001",
        "msg": "密码初始化失败"
      }
    }

    self.status = status;
    self.body = result;
  });

};
