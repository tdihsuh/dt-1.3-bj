var library = module.exports = {}
library.upExcel = async function(name,key,filename){
    //key 为时间戳    //需要填写你的 Access Key 和 Secret Key
    var qi_niu = require('qiniu');
    var accessKey = 'HyiV7hZ6-vH0ZSyEubxYAhXPyLFb-aJ4Q2ukz_4l';
    var secretKey = 'rrqgLZCgI8ql60iMaGK055jdDTtfknpwI48zaWTF';
    qi_niu.conf.ACCESS_KEY = accessKey;
    qi_niu.conf.SECRET_KEY = secretKey;
    var bucket = 'excel';
    var key=name+key+'.xlsx';
    var putPolicy = new qi_niu.rs.PutPolicy(bucket + ":" + key);
    //  return putPolicy.token();
    return new Promise((resolved, reject) => {
        qi_niu.io.putFile(putPolicy.token(), key, filename, null, function (err, ret) {
            if (err) {
                reject(err)
            }else {
                path = "http://files.uniccat.com/" + key;
             //   console.log('下载路径'+path);
                return  resolved(path)
            }
        });
    })
};

