const User = require('../models/userModel')
const Message = require('../models/messageModel')
const jwt = require('jsonwebtoken')
const catchAsync = require('../utils/catchAsync')
const {promisify} = require('util')

exports.sendMessage = async (data,io) => {
    try{
    console.log(data)
    const currentUser = await User.findOne({socketId: data.socketId}).select('+isActive')
    if(!currentUser || !currentUser.isActive){
        return io.to(data.socketId).emit('error', 'The User belongs to this token does no longer exist.');
      
    }
   
    const toUser = await User.findById(data.to).select('+socketId +socketStatus')
   

    //TODO handle message data not in db
    const message = await Message.create({
        from:currentUser._id,
        to: toUser._id,
        message: data.message,
        createdAt: new Date(Date.now())
    })
    console.log(toUser)
    if(toUser.socketId && (toUser.socketStatus === 'chat' || toUser.socketStatus === 'chatAndMapTracking')){
        console.log('user is online')
        io.to(toUser.socketId).emit('message', message);
        
    }

    console.log(message)
}catch(e){
    return io.to(data.socketId).emit('error', 'Something went wrong');
}

}

exports.getMessages = catchAsync(async (req,res,next)=>{
    
    const conditionA = {$and:[{from:req.user.id},{to:req.params.userId}]}
    const conditionB = {$and:[{to: req.user.id},{from:req.params.userId}]}
    const messages = await Message.find({
        $or: [conditionA,conditionB]
    }).sort({ createdAt: -1 })
    res.status(200).json({
        status:"success",
        data: {
            messages
        }
   })
})