const mongoose = require('mongoose')
const Schema = mongoose.Schema
const passportLocalMongoose = require('passport-local-mongoose');
var Mod = new Schema({
    username: {
        type: String
    },
    password: {
        type: String
    }
})
 
Mod.plugin(passportLocalMongoose);
 
module.exports = mongoose.model('Mod', Mod)