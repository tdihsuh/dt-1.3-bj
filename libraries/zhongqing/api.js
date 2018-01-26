var helper = module.exports = {}

helper.getGaoFaResult = async function (ctx,_params) {
    var result = {}
    try {
        var personInfoModel = ctx.model('person_info');
        var row = await personInfoModel.getRow({
            'entity_name': _params.realName,
            'identify_code': _params.idCode
        })
        if (row) {
            result = await row.data[0].sp;
        }
    } catch (err) {
        console.log(err);
    }
    return result;
}