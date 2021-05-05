const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    name: {type: String, required: true},
    organization: {type: String },
    phone: {type: String, required: true},
    date: {type: Number, required: true},
    owner: {type: Types.ObjectId, required: true}
})
schema.index({name: 'text', phone: 'text'})
module.exports = model('lead', schema)