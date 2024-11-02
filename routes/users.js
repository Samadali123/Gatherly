const mongoose = require('mongoose');


mongoose.connect("mongodb://localhost:27017/Wp")
    .then(function () {
        console.log("DB connected successfully.");
    })
    .catch(function (error) {
     console.log(error.message)
    });





const plm = require('passport-local-mongoose')

const userSchema = mongoose.Schema({
    username: String,
    number: Number,
    password: String,
    profileImage: {
        type: String,
        default: 'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-image-182145777.jpg'
    },
    socketId: String,
})

userSchema.plugin(plm)

module.exports = mongoose.model('user', userSchema)