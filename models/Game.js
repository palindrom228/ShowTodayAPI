const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    lead: {type: Types.ObjectId, ref: 'Lead', required: true},
    workers: {type: Object, required: true },
    date: {type: Number, required: true},
    dateOfCreation: {type: String, required: true},
    duration: {type: Types.ObjectId, required: true},
    comments: [{type: Object, ref: 'Comment'}],
    creator: {type: String, required: true},
    type: {type: Number, required: true},
    address: {type: String, required: false},
    summ: {type: Number, required: true},
    prepay: {type: Number, required: true},
    evening: {type: Number, required: true},
    col: {type: Number, required: true},
    age: {type: Number, required: true},
    version: {type: Number, required: true},
    removed: {type: Boolean, required: true },
    inventory: {type: Object, required: true},
    status: {type: Number, required: true},
    owner: {type: Types.ObjectId, ref: 'GamesToCity', required: true}
})
schema.index({date: 1, removed: 1})
module.exports = model('Game', schema)