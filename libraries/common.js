var helper = module.exports = {}

Date.prototype.format = function(fmt)
{
  var o = {
    "M+" : this.getMonth()+1,                 //月份
    "d+" : this.getDate(),                    //日
    "h+" : this.getHours(),                   //小时npm

    "m+" : this.getMinutes(),                 //分
    "s+" : this.getSeconds(),                 //秒
    "q+" : Math.floor((this.getMonth()+3)/3), //季度
    "S"  : this.getMilliseconds()             //毫秒
  };
  if(/(y+)/.test(fmt))
  fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)
  if(new RegExp("("+ k +")").test(fmt))
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
  return fmt;
}

helper.loadModel = function(file){
  var model = require(icecream.get('appDir')+"/model/"+file);
  return model;
}

helper.getActivityType=function(activity_type,default_val){
  for(var i in activity_type){
    if(activity_type[i].type == default_val){
      return activity_type[i].name;
    }
  }
  return "";
}

helper.sanitizeHtml = function(html){
  var sanitizeHtml = require('sanitize-html');
  return sanitizeHtml(html, {
    allowedTags: []
  });
}

helper.format_date = function(time, fmt, timezone){
  if(time == null || time == ''){
    return "";
  }

  if(timezone == undefined){
    timezone = 8
  }

  time = time + 3600*1000*timezone

  var dt = new Date(time);
  var o = {
    "M+" : dt.getUTCMonth()+1,                 //月份
    "d+" : dt.getUTCDate(),                    //日
    "h+" : dt.getUTCHours(),                   //小时
    "m+" : dt.getUTCMinutes(),                 //分
    "s+" : dt.getUTCSeconds(),                 //秒
    "q+" : Math.floor((dt.getUTCMonth()+3)/3), //季度
    "S"  : dt.getUTCMilliseconds()             //毫秒
  };
  if(/(y+)/.test(fmt))
  fmt=fmt.replace(RegExp.$1, (dt.getUTCFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)
  if(new RegExp("("+ k +")").test(fmt))
  fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
  return fmt;
}

helper.isImage = function(ext){
  ext = ext.toLowerCase();
  return ext == ".png" | ext == ".jpg" | ext == ".jpeg" | ext == ".gif" | ext == ".png";
}

helper.isVideo = function(ext){
  ext = ext.toLowerCase();
  return ext == ".mp4" | ext == ".3gp" | ext == ".avi" | ext == ".rmvb" | ext == ".rm" | ext == ".mov";
}


helper.isAudio = function(ext){
  ext = ext.toLowerCase();
  return ext == ".mp3";
}

helper.paging = function(url, params, totalPage, offset, limit, interval, _options){
  totalPage = parseInt(totalPage);
  if(totalPage == 0){
    return '';
  }

  offset = parseInt(offset);
  interval = parseInt(interval);
  currentPage = Math.ceil(offset/limit) + 1;

  var options = {
    first:"First",
    prev:"Prev",
    next:"Next",
    last:"Last"
  }

  for(var i in _options){
    options[i] = _options[i];
  }

  var count = 2; //当前页前后分页个数
  var first = 0;
  var prev  = ((currentPage-1 > 0 ? (currentPage-1): 1)-1) * limit;
  var next  = ((currentPage+1 < totalPage ? (currentPage+1): totalPage) - 1)*limit;
  var last  = (totalPage - 1)*limit;

  var html  ="<div class='ui small left pagination menu'>";
  html +="<a class='item' href='"+url+"?"+encodeURI(params)+"&offset="+first+"&limit="+limit+"'>首页</a>";
  html +="<a class='item' href='"+url+"?"+encodeURI(params)+"&offset="+prev+"&limit="+limit+"'>上一页</a>";

  if(currentPage>=count+2 && currentPage!=1 && totalPage!=count) {
    if(currentPage===count+2){
      html += "<a class='item' href='"+url+"?"+encodeURI(params)+"&offset=0"+"&limit="+limit+"'>1</a>"
    }else{
      html += "<a class='item' href='"+url+"?"+encodeURI(params)+"&offset=0"+"&limit="+limit+"'>1</a><span  class='seprator'>&sdot;&sdot;&sdot;</span>"
    }
  }

  var end = (currentPage === totalPage || currentPage+count>=totalPage) ? totalPage : currentPage+count;
  var start = (currentPage === totalPage&&totalPage>count+2) ? currentPage - count -2 : totalPage<=count||currentPage<=count ? 1 :currentPage - count;

  for(var i = start; i <= end; i++){
    html +="<a class='item "+(i===currentPage?"active":"")+"' href='"+url+"?"+encodeURI(params)+"&offset="+(i-1)*limit+"&limit="+limit+"'>"+i+"</a>";
  }

  if(currentPage+count<totalPage&&currentPage>=1&&totalPage>count){
    if(currentPage+count===totalPage-1) {
      html += "<a class='item' href='"+url+"?"+encodeURI(params)+"&offset="+(totalPage-1)*limit+"&limit="+limit+"'>"+totalPage+"</a>"
    } else {
      html += "<span class='seprator'>&sdot;&sdot;&sdot;</span><a class='item' href='"+url+"?"+encodeURI(params)+"&offset="+(totalPage-1)*limit+"&limit="+limit+"'>"+totalPage+"</a>"
    }

  }

  html +="<a class='item' href='"+url+"?"+encodeURI(params)+"&offset="+next+"&limit="+limit+"'>下一页</a>";
  html +="<a class='item' href='"+url+"?"+encodeURI(params)+"&offset="+last+"&limit="+limit+"'>末页</a>";
  html +="</div>";
  html +="<span style='float:right;'>每页&nbsp;&nbsp;<div class='ui compact selection dropdown limitSelect'><i class='dropdown icon'></i><div class='text'>"+limit+"</div><div class='menu'>";
  html +="<a class='item' href='"+url+"?"+encodeURI(params)+"&offset=0&limit=5'>5</a>";
  html +="<a class='item' href='"+url+"?"+encodeURI(params)+"&offset=0&limit=10'>10</a>";
  html +="<a class='item' href='"+url+"?"+encodeURI(params)+"&offset=0&limit=20'>20</a>";
  html +="<a class='item' href='"+url+"?"+encodeURI(params)+"&offset=0&limit=50'>50</a>";
  html +="</div></div>&nbsp;&nbsp;条</span>";
  return html;
}

//微信js-api

/**
* @synopsis 签名算法
*
* @param jsapi_ticket 用于签名的 jsapi_ticket
* @param url 用于签名的 url ，注意必须与调用 JSAPI 时的页面 URL 完全一致
*
* @returns
*/
helper.weixinSign = function (jsapi_ticket, url) {
  var ret = {
    jsapi_ticket: jsapi_ticket,
    nonceStr: createNonceStr(),
    timestamp: createTimestamp(),
    url: url
  };
  var string = raw(ret);
  var jsSHA = require('jssha');
  var shaObj = new jsSHA(string, 'TEXT');
  ret.signature = shaObj.getHash('SHA-1', 'HEX');

  return ret;
};

function createNonceStr () {
  return Math.random().toString(36).substr(2, 15);
};

function createTimestamp () {
  return parseInt(new Date().getTime() / 1000) + '';
};

function raw (args) {
  var keys = Object.keys(args);
  keys = keys.sort()
  var newArgs = {};
  keys.forEach(function (key) {
    newArgs[key.toLowerCase()] = args[key];
  });

  var string = '';
  for (var k in newArgs) {
    string += '&' + k + '=' + newArgs[k];
  }
  string = string.substr(1);
  return string;
};

/**
* 加法运算，避免数据相加小数点后产生多位数和计算精度损失。
*
* @param num1加数1 | num2加数2
*/
helper.numAdd=function(num1, num2) {
  var baseNum, baseNum1, baseNum2;
  try {
    baseNum1 = num1.toString().split(".")[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split(".")[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
  //return (num1 * baseNum + num2 * baseNum) / baseNum;
  return Number(((num1 * baseNum + num2 * baseNum) / baseNum).toFixed(2));
};

/**
* 减法运算，避免数据相减小数点后产生多位数和计算精度损失。
*
* @param num1被减数 | num2减数
*/
helper.numSub=function (num1, num2) {
  var baseNum, baseNum1, baseNum2;
  var precision;// 精度
  try {
    baseNum1 = num1.toString().split(".")[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split(".")[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  baseNum = Math.pow(10, Math.max(baseNum1, baseNum2));
  precision = (baseNum1 >= baseNum2) ? baseNum1 : baseNum2;
  return Number(((num1 * baseNum - num2 * baseNum) / baseNum).toFixed(2));
};


/**
* 乘法运算，避免数据相乘小数点后产生多位数和计算精度损失。
*
* @param num1被乘数 | num2乘数
*/
helper.numMulti=function(num1, num2) {
  var baseNum = 0;
  try {
    baseNum += num1.toString().split(".")[1].length;
  } catch (e) {
  }
  try {
    baseNum += num2.toString().split(".")[1].length;
  } catch (e) {
  }
  return Number(num1.toString().replace(".", "")) * Number(num2.toString().replace(".", "")) / Math.pow(10, baseNum);
};

/**
* 除法运算，避免数据相除小数点后产生多位数和计算精度损失。
*
* @param num1被除数 | num2除数
*/
helper.numDiv=function(num1, num2) {
  var baseNum1 = 0, baseNum2 = 0;
  var baseNum3, baseNum4;
  try {
    baseNum1 = num1.toString().split(".")[1].length;
  } catch (e) {
    baseNum1 = 0;
  }
  try {
    baseNum2 = num2.toString().split(".")[1].length;
  } catch (e) {
    baseNum2 = 0;
  }
  with (Math) {
    baseNum3 = Number(num1.toString().replace(".", ""));
    baseNum4 = Number(num2.toString().replace(".", ""));
    return (baseNum3 / baseNum4) * pow(10, baseNum2 - baseNum1);
  }
};



helper.checkVerifyCodeExpired= function(expire){
  if(!expire||isNaN(expire)){
    return true;
  }
  var now_time=new Date().getTime();
  if(expire<now_time){
    return true;
  }else{
    return false;
  }
}

helper.getWithdrawStatusInfo = function(type){
  for(var i in withdraw_status_info){
    var status=withdraw_status_info[i];
    if(status['type']==type){
      return status.tag;
    }
  }
  return "";
}


helper.getRedeemStatusInfo = function(type){
  for(var i in redeem_status_info){
    var status=redeem_status_info[i];
    if(status['type']==type){
      return status.tag;
    }
  }
  return "";
}

//获取连连支付数字码的具体信息
helper.getPaymentRetCodeInfo = function(code){
  for(var i in payment_ret_codes){
    var info=payment_ret_codes[i];
    if(info['code']==code){
      return info['msg'];
    }
  }
  return "";
}


helper.getSafeCardNo = function(card_no){
  if(card_no){
    card_no=card_no.substring(0,4)+"********"+card_no.substring(card_no.length-4,card_no.length);
    return card_no;
  }else{
    return "";
  }
}

helper.getSafeIdNo = function(id_no){
  if(id_no&&id_no.length>0){
    id_no=id_no.substring(0,4)+"****"+id_no.substring(id_no.length-5,id_no.length);
    return id_no;
  }else{
    return "";
  }
}

helper.getSafeMobile = function(mobile){
  if(mobile&&mobile.length>0){
    mobile=mobile.substring(0,3)+"****"+mobile.substring(mobile.length-4,mobile.length);
    return mobile;
  }else{
    return "";
  }
}

helper.getCurrentDay=function(){
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth()+1;
  var day = date.getDate();
  var today = new Date(year+"-"+month+"-"+day);
  return today;
};

helper.addDays=function(date,d){
  date.setDate(date.getDate() + d);
  return date;
};

helper.addMonths=function(date,m){
  var d = date.getDate();
  date.setMonth(date.getMonth() + m);
  if (date.getDate() < d)
  date.setDate(0);
  return date;
};

helper.getDateDiff=function(startDate,endDate){
  var startTime = new Date(Date.parse(startDate)).getTime();
  var endTime = new Date(Date.parse(endDate)).getTime();
  var dates = Math.abs((startTime - endTime))/(1000*60*60*24);
  return  dates;
}

helper.getContractNoSuffix = function(){
  var time1=format_date(new Date(),"MMddhhmmss");
  var time2=(Math.random()+"").substr(2, 3);
  return time1+time2;
}
