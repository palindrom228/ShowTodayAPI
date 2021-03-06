const {Schema, model, Types} = require('mongoose')

const schema = Schema({
    createDate: {type: Number, required: true},
    date: {type: Number, required: true},
    message: {type: String, required: true},
    owner: {type: Types.ObjectId, required: true},
    creator: {type: Types.ObjectId, required: true, ref: 'User'},
    GamesBase: {type: Types.ObjectId, required: true, ref: 'GamesToCity'}
})
schema.index({ date: 1})
module.exports = model('Comments',schema)