const mongoose = require("mongoose");


const messageSchema = mongoose.Schema({
   message: {
    type: String,
    required: [true,`There's no message`]
   },
   messageType: {
     type: String,
     required: [true,`Messager must have a type`],
     enum: ['text','image','audio']
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
        default: new Date()
    }
})

const Message = mongoose.model('Message',messageSchema)
module.exports = Message 