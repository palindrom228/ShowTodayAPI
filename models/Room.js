const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    owner: {type: String, required: true},
    clients: [{type: Object}],
})
module.exports = model('Room', schema)