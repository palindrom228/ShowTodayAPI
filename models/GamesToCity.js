const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    owner: {type: Types.ObjectId,ref: 'City', required: true},
    games: [{type: Types.ObjectId, ref: 'Game'}],
    version: {type: Number, required: true},
    name: {type: String, required: true},
    type: {type: String, required: true}
})
module.exports = model('GamesToCity', schema)