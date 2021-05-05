const {Schema, model, Types} = require('mongoose')

const schema = Schema({
    createDate: {type: Number, required: true},
    date: {type: Number, required: true},
    message: {type: String, required: true},
    type: {type: String, required: true},
    status: {type: Number, required: true},
    owner: {type: Types.ObjectId, required: true, ref: 'Game'},
    creator: {type: Types.ObjectId, required: true, ref: 'User'}
})
schema.index({type: 1, date: 1})
module.exports = model('Comments',schema)