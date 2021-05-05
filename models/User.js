const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    type: {type: Number, required: true},
    city: {type: String, required: true},
    salary: {type: Object},
    name: {type: String, required: true},
    cityId: {type: Types.ObjectId, ref: 'City'},
    version: {type: Number}
})
module.exports = model('User', schema)