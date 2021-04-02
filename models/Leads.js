const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    leads: [{type: Object, ref: 'lead'}],
    owner: {type: String, required: true},
})

module.exports = model('Leads', schema)