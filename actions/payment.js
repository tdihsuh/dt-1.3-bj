module.exports = function($) {

  //充值记录
  $.get("/payments", async (ctx, next) => {
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

    //获取充值记录
    var paymentLogModel = self.model("payment_log");

    var totalPage = 0;
    var count = await paymentLogModel.getRowsCount(params);
    if (count) {
      totalPage = Math.ceil(count / limit);
    }

    var rows = await paymentLogModel.getPagedRows(params, offset, limit, {
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
    } else {
      status = 400;
    }

    //获取用户信息
    var rows = []
    for (var i in result.rows) {
      var row = result.rows[i];
      row = row.toObject();
      rows.push(row);

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
    }
    result.rows = rows;

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
    result.title = '充值记录';
    await self.render('payments/payments', result);
  });

  //充值
  $.post("/payments", async (ctx, next) => {
    var self = ctx;
    var _params = self.request.fields;

    var status = 201;
    var result = {};

    //创建充值记录
    var paymentLogModel = self.model("payment_log");
    var isSuccess = await paymentLogModel.createRow(_params);
    if (isSuccess) {
      status = 201;
    } else {
      result = "充值失败!";
      status = 400;
    }
    //更新账号余额
    var userModel = self.model("user");
    var isRows = await userModel.getRow({

    });
    var is_notice = 0;
    var isSuccess = await userModel.updateRow({
      _id: _params.user_id
    }, {
      $inc: {
        balance   : _params.recharge
      },
    });

    if (isSuccess) {
      status = 201;
      var row = await userModel.findOneAndUpdate({
          _id: _params.user_id,
          balance : {$gte : 2000}
      },{
          is_notice : is_notice
      });
    } else {
      result = "充值失败!";
      status = 400;
    }
    self.status = status;
    self.body = result;
  });

};
