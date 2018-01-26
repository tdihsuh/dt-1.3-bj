module.exports = function($) {

  //API授权列表
  $.get("/api_applies", async (ctx, next) => {
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

    //查询满足条件的所有用户ID
    var username = _params["username"] ? _params["username"] : "";
    var company = _params["company"] ? _params["company"] : "";
    if (username != '' || company != '') {
      var userModel = self.model("user");

      var p = {}
      if (username != '') {
        p.username = new RegExp(username, 'i')
      }
      if (company != '') {
        p.company = new RegExp(company, 'i')
      }

      var users = await userModel.getRows(p);
      var ids = []
      if (users) {
        users.forEach(function(user) {
          ids.push(user._id);
        })
      }
      params.user_id = {
        $in: ids
      };
    }

    //获取授权列表
    var apiApplyModel = self.model("api_apply");

    var totalPage = 0;
    var count = await apiApplyModel.getRowsCount(params);
    if (count) {
      totalPage = Math.ceil(count / limit);
    }

    var rows = await apiApplyModel.getPagedRows(params, offset, limit, {
      created: -1
    });

    if (rows) {
      result = {
        rows: rows,
        offset: offset,
        limit: limit,
        totalPage: totalPage,
        username: username,
        company: company
      };
    }

    //获取用户详情、API详情
    var rows = []
    for (var i in result.rows) {
      var row = result.rows[i];
      row = row.toObject();
      rows.push(row);

      //用户详情
      var userModel = self.model("user");
      var user_id = row.user_id;

      var user = await userModel.getRow({
        _id: user_id
      });
      if (user) {
        row.user = user;
      } else {
        row.user = {};
      }

      //API详情
      var apiModel = self.model("api");
      var api = await apiModel.getRow({
        _id: row.api_id
      });
      if (api) {
        row.api = api;
      }
    }
    result.rows = rows;

    //获取API列表
    var apiModel = self.model("api");
    var apis = await apiModel.getRows({}, {
      created: -1
    });
    if (apis) {
      result.apis = apis;
    } else {
      result.apis = [];
    }

    //获取用户列表
    var userModel = self.model("user");
    var users = await userModel.getRows({}, {
      created: -1
    });
    if (users) {
      result.users = users;
    } else {
      result.users = [];
    }

    var common = self.library("common");
    result.common = common;
    result.title = 'API 授权列表';
    await self.render('apis/applies', result);
  });

  //创建API授权
  $.post("/api_applies", async (ctx, next) => {
    var self = ctx;
    let _params = self.request.fields;
    var status = 201;
    var result = {};

    var apiApplyModel = self.model("api_apply");
    var isExist = await apiApplyModel.getRow({
      user_id: _params.user_id,
      api_id: _params.api_id
    });

    if (isExist) {
      result = "不能重复添加授权信息!";
      status = 400;
    } else {
      //创建
      var isSuccess = await apiApplyModel.createRow(_params);
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

  //获取API授权信息
  $.get("/api_applies/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;

    var status = 200;
    var result = {};
    var apiApplyModel = self.model("api_apply");
    var row = await apiApplyModel.getRow({
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

  //编辑API授权信息
  $.put("/api_applies/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    var apiApplyModel = self.model("api_apply");

    var isSuccess = await apiApplyModel.findOneAndUpdateRow({
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

  //删除 API 授权信息
  $.delete("/api_applies/:_id", async (ctx, next) => {
    var self = ctx;
    var result = {};

    var _id = self.params._id;

    var apiApplyModel = self.model("api_apply");
    var isSuccess = await apiApplyModel.deleteRow({
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
