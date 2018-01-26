module.exports = function($) {

  //API列表
  $.get("/apis", async (ctx, next) => {
    var self = ctx;

    //admin 角色才可访问
    if (!self.session.user || !(self.session.user_type == 'admin')) {
      self.redirect('/login');
      return;
    }

    var _params = self.request.query;

    var offset = _params.offset ? _params.offset : 0;
    var limit = _params.limit ? _params.limit : config.get("limit");
    var category = _params.category && _params["category"] != "all" ? _params.category : '';
    var billing_mode = _params.billing_mode && _params["billing_mode"] != "all" ? _params.billing_mode : '';

    var result = {};
    var status = 200;

    var params = {};

    if (billing_mode != '') {
      params.billing_mode = billing_mode;
    }

    if (category != '') {
      params.category = category;
    }

    var apiModel = self.model("api");

    var totalPage = 0;
    var count = await apiModel.getRowsCount(params);
    if (count) {
      totalPage = Math.ceil(count / limit);
    }

    var rows = await apiModel.getPagedRows(params, offset, limit, {
      created: -1
    });
    if (rows) {
      result = {
        rows: rows,
        offset: offset,
        limit: limit,
        totalPage: totalPage,
        billing_mode: billing_mode,
        category: category
      };
    }

    var common = self.library("common");
    result.common = common;
    result.title = 'API 列表';
    await self.render('apis/apis', result);
  });

  //创建 API
  $.post("/apis", async (ctx, next) => {
    var self = ctx;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    //创建
    var apiModel = self.model("api");
    var isExist = await apiModel.getRow({
      name: _params.name
    });
    if (isExist) {
      status = 400;
      result = "API已经存在！";
    } else {
      var isSuccess = await apiModel.createRow(_params);
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

  //获取API信息
  $.get("/apis/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;

    var status = 200;
    var result = {};
    var apiModel = self.model("api");
    var row = await apiModel.getRow({
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

  //编辑API
  $.put("/apis/:_id", async (ctx, next) => {
    var self = ctx;
    var _id = self.params._id;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    var apiModel = self.model("api");
    var row = await apiModel.findOneAndUpdateRow({
      _id: _id
    }, _params);

    if (row) {
      status = 201;
    } else {
      result = "更新失败!";
      status = 400;
    }

    self.status = status;
    self.body = result;
  });

  //删除 API
  $.delete("/apis/:_id", async (ctx, next) => {
    var self = ctx;
    var result = {};

    var _id = self.params._id;

    var apiModel = self.model("api");
    var isSuccess = await apiModel.deleteRow({
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
