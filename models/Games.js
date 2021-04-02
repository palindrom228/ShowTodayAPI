const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    owner: {type: String, required: true},
    games: [{type: Object, ref: 'Game'}],
    version: {type: Number, required: true}
})
module.exports = model('Games', schema)