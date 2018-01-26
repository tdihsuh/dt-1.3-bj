var helper = module.exports = {}

//是否查询过
helper.isQueried = async function(api_id, query, self) {
  var queryHistoryModel = self.model('query_history');
  var isQueried = await queryHistoryModel.getRow({
    api_id: api_id,
    query: JSON.stringify(query)
  });
  return isQueried;
}

//是否查询过企业
helper.isQueriedCompany = async function(api_id, query, self) {
    var queryHistoryModel = self.model('query_history');
    let identity_key;
    if (query.identity_name){
        identity_key = query.identity_name;
    }

    if (query.identity_code){
        identity_key = query.identity_code;
    }

    if (query.identity_name && query.identity_code){
        identity_key = query;
    }

    var isQueried = await queryHistoryModel.getRow({
        api_id: api_id,
        query: eval("/" + identity_key + "/i")
    });
    return isQueried;
}

//保存到查询历史
helper.saveToQueryHistory = async function(api_id, query, data, self) {
  var queryHistoryModel = self.model("query_history");
  var isSaved = await queryHistoryModel.getRow({
    api_id: api_id,
    query: query
  });
  if (!isSaved) {
    var isSuccess = await queryHistoryModel.createRow({
      api_id: api_id,
      query: query,
      data: data
    });
    if (isSuccess) {
      console.log('添加成功');
    } else {
      console.log('添加失败');
    }
  } else {
    console.log('已经保存过');
  }
}

//保存到查询日志
helper.saveToQueryLog = async function(user_id, api_id, apply_id, batch_id, group_id, query, query_type, data, query_status, self) {
  var userModel = self.model('user');
  var apiModel = self.model('api');
  var apiApplyModel = self.model('api_apply');
  var queryLogModel = self.model('query_log');

  //获取API信息
  var api = await apiModel.getRow({
    _id: api_id
  });

  //获取授权信息
  var apply = await apiApplyModel.getRow({
    _id: apply_id
  });

  var charged = 0;
  //查询计费
  if (apply.billing_mode == 1 && query_status == 1) {
    charged = apply.price;
  }
  //查得计费
  if (apply.billing_mode == 0) {
    charged = apply.price;
  }

  var isSuccess = false;
  if (group_id != '') {

    //防止重复提交同一个API的请求
    var mongoose = require('mongoose');
    isExist = await queryLogModel.getRow({
      'user_id': user_id,
      'group_id': group_id,
      'queries.api._id': mongoose.Types.ObjectId(api_id)
    })

    if(!isExist){
      isSuccess = await queryLogModel.updateOrInsertRow({
        'user_id': user_id,
        'group_id': group_id
      }, {
        'user_id': user_id,
        'batch_id': batch_id,
        'group_id': group_id,
        'created': new Date().getTime(),
        $push: {
          queries: {
            'apply': apply,
            'api': api,
            'charged': charged,
            'query': query,
            'query_type': query_type,
            'data': data,
            'query_status': query_status
          }
        }
      })
    }
  } else {
    isSuccess = await queryLogModel.createRow({
      'user_id': user_id,
      'group_id': group_id,
      'batch_id': batch_id,
      'queries': [{
        'apply': apply,
        'api': api,
        'charged': charged,
        'query': query,
        'query_type': query_type,
        'data': data,
        'query_status': query_status
      }]
    });
  }

  //扣费
  if (isSuccess) {
    charging(user_id, charged, self);
  }
}

//验证API权限
helper.check_api = async function(user_id, api_id, self) {
  var apiApplyModel = self.model('api_apply')
  var row = await apiApplyModel.getRow({
    user_id: user_id,
    api_id: api_id
  })

  var isAuthorized = false;
  if (row) {
    isAuthorized = true;
  }
  return isAuthorized;
}

//验证IP白名单
helper.check_ip = async function(user_id, remote_ip, self) {
    let userModel = self.model('user')
    let row = await userModel.getRow({
        user_id: user_id
    })

    let isAuthorized = false;
    if(row.uniform){
        let ips = row.uniform.split(";");
        for(let i = 0;i<ips.length;i++){
            if (ips[i]==remote_ip) {
                isAuthorized = true;
            }
        }
    }

    return isAuthorized;
}



//判断余额
helper.check_balance = async function(user_id, apply_id, self) {
  var config = require('config');
  var userModel = self.model('user');
  var apiApplyModel = self.model('api_apply');

  //获取价格
  var priceRow = await apiApplyModel.getRow({
    _id: apply_id,
    user_id: user_id
  });

  var userRow = await userModel.getRow({
    _id: user_id
  });

  if (priceRow && userRow) {
    var price = priceRow.price;
    //判断余额是否足够
    if (userRow.balance - price < 0) {
      return false
    } else {
      return true
    }
  } else {
    return false
  }
}

//扣费
async function charging(user_id, charged, self) {
  var userModel = self.model('user');
  var isSuccess = await userModel.updateRow({
    _id: user_id
  }, {
    '$inc': {
      balance: -charged
    }
  });

  //余额小于2000，发送邮件通知用户充值
  if (isSuccess){
      var row = await userModel.getRow({
          _id: user_id
      });
      var is_notice = row.is_notice;
      var email = row.email;
      var obj;
      var timestamp = new Date().toLocaleString();
      if (row.balance < 2000 && is_notice == 0){
          obj = {
              balance   : row.balance,
              timestamp :timestamp
          }

          var html = await email_credit(obj);
          var params2 = {
              'from': "cycredit@sUgS9yPWVU62ZzBtECIvgFI2GYvy4GXx.sendcloud.org",
              'to': email,
              'subject': '【黑猫察】充值提醒',
              'html': html,
              'respEmailId': 'true',
              'fromName': ' 中青信用管理有限公司  运营部'
          }
          var email = self.library('email');
          var send = await email.sendCloudEmail(params2);
          if (send){
              var row = await userModel.updateRow({
                  _id: user_id
              },{
                  is_notice : 1
              });
          }else {
              console.log('发送失败');
          }
      }
  }
}

helper.check_params = async function(params,params_num){
    let message = "success"
    let telReg = /^1[0-9]{10}$/i;
    if(params_num<=3){
        if(!params.realName){
            message = '姓名格式错误!';
            return await message;
        }

        if (helper.codeValid(params.idCode)!=="") {
            message = "身份证号格式错误!";
            return await message;
        }
    }
    if(params_num==3){
        if (params.phoneNumber && !telReg.test(params.phoneNumber)) {
            message = '手机号格式错误!';
            return await message;
        }
    }
    return await message;
}

helper.codeValid = function (code) {
    code = code.toString().toUpperCase();
    const city = {
        11: "北京", 12: "天津", 13: "河北", 14: "山西", 15: "内蒙古", 21: "辽宁", 22: "吉林",
        23: "黑龙江 ", 31: "上海", 32: "江苏", 33: "浙江", 34: "安徽", 35: "福建", 36: "江西",
        37: "山东", 41: "河南", 42: "湖北 ", 43: "湖南", 44: "广东", 45: "广西", 46: "海南",
        50: "重庆", 51: "四川", 52: "贵州", 53: "云南", 54: "西藏 ",
        61: "陕西", 62: "甘肃", 63: "青海", 64: "宁夏", 65: "新疆", 71: "台湾", 81: "香港", 82: "澳门", 91: "国外 "
    };
    let tip = "";

    if (!code || !/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/i.test(code)) {
        tip = "身份证号格式错误";
    }

    else if (!city[code.substr(0, 2)]) {
        tip = "身份证号格式错误";
    }
    else {
        //18位身份证需要验证最后一位校验位
        if (code.length == 18) {
            code = code.split('');
            //∑(ai×Wi)(mod 11)
            //加权因子
            let factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
            //校验位
            let parity = [1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2];
            let sum = 0;
            let ai = 0;
            let wi = 0;
            for (let i = 0; i < 17; i++) {
                ai = code[i];
                wi = factor[i];
                sum += ai * wi;
            }
            let last = parity[sum % 11];
            if (parity[sum % 11] != code[17]) {
                tip = "身份证号格式错误";
            }
        }
    }
    return tip;
};

//发送邮件
async function email_credit (params) {
    var html1 = '<div style="background: url(\'http://images.uniccat.com/HMC151503610879590876864163\') no-repeat;width: 100%;height: auto;-webkit-background-size:cover ;background-size:cover ;box-sizing: border-box;overflow: hidden;";>\n' +
        '<div style="background-color: #fff;margin: 80px auto 20px;box-shadow:inset 0px -3px 0px 0px rgba(53,55,66,0.24);border-radius:4px;background-image: url(\'http://images.uniccat.com/HMC151503617078844045983176\');background-repeat: no-repeat;background-size: 128px;background-position: 50% 20px;box-sizing: border-box;overflow: hidden;width: 600px;height: 80%;min-height: 440px;">\n' +
        '    <div style="width: 100%;height: auto;min-height: 200px;background-color: #f4f5f7;box-sizing: border-box;margin-top: 24%;">\n' +
        '        <p style="padding-left: 40px;padding-top: 20px;color:#57595f;box-sizing: border-box">\n' +
        '       尊敬的用户:\n' +
        '        </p>\n' +
        '        <p style="padding-left: 40px;padding-right: 40px;padding-bottom: 20px;color:#57595f;padding-top: 30px;box-sizing: border-box">\n' +
        '           您好！<br/>' +
        '           截止'+params.timestamp+'，您账户余额为'+params.balance+'元，以免影响您的使用，请您及时缴费。<br/>' +
        '           感谢您的对黑猫察的信赖和支持！<br/>' +

        '        </p>\n' +
        '    </div>\n' +
        '    <p style="padding-left: 40px;padding-top: 10px;color:#57595f;box-sizing: border-box">\n' +
        '        黑猫察\n' +
        '        <br>\n' +
        '        ----\n' +
        '        <br>\n' +
        '        中青信用管理有限公司 运营部\n' +
        '    </p>\n' +
        '</div>\n' +
        '<div style="width: 100%;font-size:14px;color:#ffffff;line-height:22px;text-align:center;margin-bottom: 20px;">\n' +
        '    © 2018 <span style="font-size:14px;color:#7fbbf6;line-height:22px;">中青信用</span> . All Rights Reserved.\n' +
        '</div>\n' +
        '\n' +
        '</div>'

    return html1
};
