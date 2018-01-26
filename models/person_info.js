/**
 * Created by ykj on 2017/11/15.
 */
var schema = require('./base/model')({
    person_code   : { type: String, default: '' },
    person_info   : {},
    identify_code : { type: String, default: '' },
    identify_name : { type: String, default: '' },
    data          : {},
    created       : { type: Number, default: Date.now }
});

schema.index({ person_code: 1 })
schema.index({ identify_code: 1 })
schema.index({ identify_name: 1 })
schema.index({ created: 1 })

module.exports = schema
