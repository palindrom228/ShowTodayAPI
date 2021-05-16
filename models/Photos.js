const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    owner: {type: Types.ObjectId, required: true},
    path: {type: String, required: true},
    minPath: {type: String, required: true},
    date: {type: Number, required: true}
})
schema.index({owner: 1, date: 1})
module.exports = model('Photos', schema)