module.exports = function ($) {
    /**
     * 版本升级提示
     * target : web端用户 /ios端用户/Android 端用户
     * time :客户端的当前时间
     * 取starttime  和endTime 提示是否升级
     *
     */
    $.get("/api/v1/version/upgrade", async (ctx, next) => {
        var self = ctx
        var result = {}
        var _params = self.request.query;
        var timestamp = _params.timestamp;
        var target=_params.target;
        var messageMode = self.model("message");
        var rows = await  messageMode.getRows({target:target})
        if (rows) {
            for (let i = 0; i < rows.length; i++) {
                if (timestamp < rows[i]['to'] && timestamp > rows[i]['from']) {
                    result = {
                        code: 200,
                        message: '升级提示',
                        row: rows[i]
                    }
                    self.body = result
                    return
                }
            }
        }
        result = {
            code: 201,
            message: '暂无升级',
        }
        self.body = result

    });


}