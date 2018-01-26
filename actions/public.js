module.exports = function($) {

    $.get("/", async (ctx, next) => {
    var self = ctx;

    //将session放入ejs渲染数据中
    self.state.session = self.session;
    if (!self.session.user) {
      self.redirect('/login');
      return;
    }

    var _params = self.request.query;
    var results = {};

    if (self.redis.status === 'ready') {
      await self.redis.set('foo', 'bar');
      var bar = await self.redis.get('foo')
      console.log(bar)
    }
    results.title = "首页";

    await self.render('index', results);
  });

    //七牛上传凭证
    $.get('/qiniu/token/:key', async (ctx, next) => {
        var qi_niu = require('qiniu');
        var self = ctx;
        var result = {};
        var _params = self.request.query;
        var key = self.params.key;
        var status = 200;
        //需要填写你的 Access Key 和 Secret Key
        var accessKey = 'HyiV7hZ6-vH0ZSyEubxYAhXPyLFb-aJ4Q2ukz_4l';
        var secretKey = 'rrqgLZCgI8ql60iMaGK055jdDTtfknpwI48zaWTF';
        qi_niu.conf.ACCESS_KEY = accessKey;
        qi_niu.conf.SECRET_KEY = secretKey;

        //要上传的空间
        var bucket = 'blackcat';
        console.log(key);
        //构建上传策略函数
        function uptoken(bucket, key) {
            var putPolicy = new qi_niu.rs.PutPolicy(bucket + ":" + key);
            return putPolicy.token();
        }
        //生成上传 Token
        var token = uptoken(bucket, key);

        if (token) {
            status = 200;
            result = token;
        } else {
            status = 400;
        }
        self.status = status;
        self.body = result;
    });

    //账号登录
    $.get("/login", async (ctx, next) => {
    var self = ctx;
    await self.render('login', {
      layout: 'layout_login',
      title: '登录'
    });
  });

    $.post("/login", async (ctx, next) => {
    var self = ctx;
    var _params = self.request.fields;
    if (self.validate(_params, {
        username: "required",
        password: "required"
      }).length !== 0) {
      self.status = 400;
      self.body = '参数有误';
      return;
    }

    var adminModel = self.model("admin");
    var username = _params["username"];
    var password = _params["password"];
    var params = {
      username: username,
      password: password
    };

    var row = await adminModel.getRow(params);

    if (row) {
      self.status = 201;
      self.session.user = row;
      self.session.user_type = 'admin';
      self.body = row;
    } else {
      self.status = 400;
      self.body = {};
    }

  });

    $.get("/logout", async (ctx, next) => {
    var self = ctx;
    self.session = null;
    self.redirect('/login');
  });

    $.get("/init", async (ctx, next) => {
    var self = ctx;

    var adminModel = self.model("admin");

    var crypto = require('crypto');
    var md5 = crypto.createHash('md5');
    md5.update('admin', 'utf8');
    var password = md5.digest('hex');

    var isExist = await adminModel.getRow({
      username: 'admin'
    });

    if (isExist) {
      var isSuccess = await adminModel.updateRow({
        username: 'admin'
      }, {
        password: password,
        role: 'admin'
      });

      if (isSuccess) {
        self.body = "success"
      } else {
        self.body = "failed"
      }
    } else {
      var isSuccess = await adminModel.createRow({
        username: 'admin',
        password: password,
        role: 'admin'
      });

      if (isSuccess) {
        self.body = "success"
      } else {
        self.body = "failed"
      }
    }
  });
};
