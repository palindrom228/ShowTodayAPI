const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    city: {type: String, required: true},
    owner: {type: String, required: true},
    workers: [{type: String}],
    admins: [{type: String, required: true}],
    studios: [{type: Types.ObjectId, required: false}]
})
module.exports = model('City', schema)