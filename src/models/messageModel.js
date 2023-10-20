const mongoose = require("mongoose");


const messageSchema = mongoose.Schema({
   message: {
    type: String,
    //required: [true,`There's no message`]
   },
   from: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
   },
   to: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
   },
    createdAt: { 
        type: Date,
        default: new Date(Date.now())
    }
})

const Message = mongoose.model('Message',messageSchema)
module.exports = Message 