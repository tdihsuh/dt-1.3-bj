module.exports = function($) {

  //查询明细
  $.get("/queries", async (ctx, next) => {
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

    var elemMatch = {
      $elemMatch: {}
    }
    var api_id = _params["api_id"] && _params["api_id"] != "all" ? _params["api_id"] : "";
    if (api_id != '') {
      var mongoose = require('mongoose');
      elemMatch.$elemMatch['api._id'] = mongoose.Types.ObjectId(api_id);
    }

    var query_status = _params["query_status"] && _params["query_status"] != "all" ? _params["query_status"] : "";
    if (query_status != '') {
      elemMatch.$elemMatch['query_status'] = parseInt(query_status);
    }

    params.queries = elemMatch;

    var fields = {}
    if (Object.keys(params.queries.$elemMatch).length > 0) {
      fields = {
        apply_id: 1,
        group_id: 1,
        user_id: 1,
        created: 1,
        'queries.$': 1
      }
    } else {
      delete params.queries;
    }

    var queryLogModel = self.model("query_log");

    var totalPage = 0;

    var count = await queryLogModel.getRowsCount(params);
    if (count) {
      totalPage = Math.ceil(count / limit);
    }

    var rows = await queryLogModel.getFilteredPagedRows(params, offset, limit, {
      created: -1
    }, fields);

    if (rows) {
      result = {
        rows: rows,
        offset: offset,
        limit: limit,
        totalPage: totalPage,
        username: username,
        company: company,
        api_id: api_id,
        query_status: query_status
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

    var common = self.library("common");
    result.common = common;
    result.title = '查询明细';

    await self.render('queries/queries', result);
  });

};
