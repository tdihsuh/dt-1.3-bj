var library = module.exports = {}
library.sendCloudEmail = function (params2) {
    var request = require("request");
    params2['apiUser'] = 'zqxy_test_42up2f';
    params2['apiKey'] = 'bAfl0mYdcN5pcyvP';
    var options = {
        url: 'http://api.sendcloud.net/apiv2/mail/send',
        method: "POST",
        // headers:headers
        form: params2
    }
    return new Promise((resolve, reject) => {
        request(
            options
            , (err, res, body) => {
                if (!err && res.statusCode == 200) {
                    console.log('发送成功');
                    return resolve(body);
                }else if(res.statusCode == 501){
                    return resolve('服务器异常');
                }else{
                    return reject(err);
                }
            });
    });
}
library.sendMail = function (mailOptions, callback) {
    var nodemailer = require("nodemailer");
    var smtpTransport = nodemailer.createTransport("SMTP", {
        host: 'smtpcloud.sohu.com',
        port: '25',
        auth: {
            user: "postmaster@weyu-message.sendcloud.org",
            pass: "LsOnrMF8oYHmcg9m"
        }
    });
    smtpTransport.sendMail(mailOptions, function (error, response) {
        callback(error, response);
        smtpTransport.close();
    });

}
