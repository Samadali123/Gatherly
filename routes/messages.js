const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    msg: String,
    sender: String,
    receiver: String,
});

module.exports = mongoose.model('message', messageSchema);