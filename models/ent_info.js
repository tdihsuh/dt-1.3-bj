var schema = require('./base/model')({
    ent_code: {type: String, default: '', index: true},
    ent_info: {},
    credit_no:{type: String, default: ''},
    ent_name:{type: String, default: ''},
    reg_no:{type: String, default: ''},
    org_no:{type: String, default: ''},
    ent_score:{type: Number, default: 0},
    data: {},
    created: {type: Number, default: Date.now }
});

schema.index({ ent_name: 1 })
schema.index({ created: 1 })

module.exports = schema
