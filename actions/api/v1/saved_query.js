module.exports = function($) {
  //保存查询信息
  $.post("/api/v1/users/:user_id/saved_queries", async (ctx, next) => {
    var self = ctx;
    var _params = self.request.fields;
    var _id = 0;
    var status = 200;
    var result = {};
    var user_id =self.params.user_id;
    var _data = _params.data ? JSON.stringify(_params.data) : '';
    var query_type = _params.query_type ? _params.query_type : 0;
    var query = _params.query? JSON.stringify(_params.query) : '';
    var params = {
        data: _data,
        user_id: user_id,
        query_type: query_type,
        query: query
    };
    var queryModel = self.model("saved_query");
    var row = await queryModel.getRow({
        user_id: user_id,
        query: eval("/" + query + "/i")
    });
    if (row) {
      status = 403; //已保存
      result = false;
    } else {
      status = 200; //未保存
      var isSuccess = await queryModel.createRow(params);
      if (isSuccess) {
        _id = isSuccess._id;
        status = 200;
        result = true;
      } else {
        status = 400;
        result = false;
      }
    }
    self.status = status;
    self.body = result;
  });

  //已保存失信列表
  $.get("/api/v1/users/:user_id/saved_queries", async (ctx, next) => {
    var self = ctx;
    var _params = self.request.query;
    var offset = _params.offset ? _params.offset : 0; //下标
    var limit = _params.limit ? _params.limit : config.get("limit"); //取多少个
    var sort = _params.sort ? _params.sort : 1;
    var charKey = _params.charKey ? _params.charKey : '';
    var user_id = self.params.user_id;
    var query_type = _params.query_type ? _params.query_type : 0;
    var params = {
      'user_id': user_id,
      'query_type': query_type
    };
    var result = {};
    var status = 200;
    var total = 0;
    var queryMode = self.model("saved_query");
    var rows = await queryMode.getRows(params);
    if (rows) {
      total = rows.length;
      var success = await queryMode.getFilteredPagedRows(params, offset, limit, {
        created: sort
      },'');

      if (success) {
        status = 200;
        result = {
          totalPage: total,
          offset: offset,
          limit: limit,
          rows: success,
        };
      } else {
        status = 400;
      }
    } else {
      status = 400;
    }
    var personQuery = {
      user_id: user_id,
      query_type: query_type,
      data: eval("/" + charKey + "/i")
    };
    if (charKey) {
      var charRows = await queryMode.getRows(personQuery, {
        create: sort
      });
      if (charRows) {
        total = charRows.length;
        var success = await queryMode.getFilteredPagedRows(personQuery, offset, limit, {
          created: sort
        },'');

        if (success) {
          status = 200;
          result = {
            totalPage: total,
            offset: offset,
            limit: limit,
            rows: success,
          };
        } else {
          status = 400;
        }
      } else {}
    }
    self.status = status;
    self.body = result;
  });

  //删除保存
  $.delete("/api/v1/users/:user_id/saved_queries", async (ctx, next) => {
    var self = ctx;
    var result = {};
    var status = 200;
    var _params = self.request.query;
    var user_id = self.params.user_id ;
    var listArr = _params;
    var queryMode = self.model("saved_query");
    for (let i in listArr) {
      if (listArr[i]) {
        var rows = await queryMode.deleteRow({
          _id: listArr[i],
          user_id: user_id
        });
        if (rows) {
          status = 201;
          result = true;
        } else {
          status = 400;
          result = false;
        }
      }
    }
    self.status = status;
    self.body = result;
  });

  // 查询已保存
  $.get('/api/v1/users/:user_id/saved_queries/:query/:query_type', async (ctx, next) => {
    var self = ctx;

    var result = {};
    var user_id = self.params.user_id;
    var query = self.params.query;
    var querykey = '';
    var query_type = self.params.query_type;
    var status = 200;
    var savedQueryModel = self.model('saved_query');

    if (JSON.parse(query).identity_name){
        querykey = JSON.parse(query).identity_name;
    }
    if (JSON.parse(query).identity_code){
        querykey = JSON.parse(query).identity_code;
    }
    var isSaved;

    if (query_type == 1){
        isSaved = await savedQueryModel.getRow({
            user_id: user_id,
            query_type:query_type,
            query:{$regex:querykey,$options:'i'}
        });
        console.log(isSaved);
    }else {
        isSaved = await savedQueryModel.getRow({
            user_id: user_id,
            query_type:query_type,
            query: eval("/" + query + "/i")
        });
    }

    if(isSaved){
        status = 200;
        result = {
          data : isSaved.data,
          query: isSaved.query
      };
    }else {
        status = 400;
    }
    self.status = status;
    self.body = result;
  });
}
