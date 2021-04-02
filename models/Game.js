const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    lead: {type: String, required: true},
    workers: {type: Object, required: true },
    date: {type: Number, required: true},
    dateOfCreation: {type: String, required: true},
    duration: {type: Number, required: true},
    comments: [{type: Object, ref: 'Comment'}],
    creator: {type: String, required: true},
    type: {type: Number, required: true},
    address: {type: String, required: true},
    summ: {type: Number, required: true},
    prepay: {type: Number, required: true},
    evening: {type: Number, required: true},
    col: {type: Number, required: true},
    age: {type: Boolean, required: true},
    version: {type: Number, required: true},
    removed: {type: Boolean }
})
module.exports = model('Game', schema)