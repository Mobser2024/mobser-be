const User = require('../models/userModel')
const Message = require('../models/messageModel')
const jwt = require('jsonwebtoken')
const catchAsync = require('../utils/catchAsync')
const {promisify} = require('util')

exports.assignSocketIdToUser = async (token,socket)=> {
    if(!token){
       // io.to(socket.id).emit('error',`You are not logged in!`)
       socket.emit('error',`You are not logged in!`)
        return socket.disconnect()
        
    }

    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)

    const currentUser = await User.findByIdAndUpdate(decoded.id,{socketId:socket.id})
}

exports.removeSocketId = async (socketId) => {
    
    const user = await User.findOneAndUpdate({socketId},{$unset : {socketId:""}},{new:true})
   
}

exports.sendMessage = async (data,io) => {
    
    const currentUser = await User.findOne({socketId: data.socketId}).select('+isActive')
    if(!currentUser || !currentUser.isActive){
        return io.to(data.socketId).emit('error', 'The User belongs to this token does no longer exist.');
      
    }

   
   
    const toUser = await User.findById(data.to)
   

    //TODO handle message data not in db
    const message = await Message.create({
        from:currentUser._id,
        to: toUser._id,
        message: data.message
    })
    if(toUser.socketId){
        io.to(toUser.socketId).emit('message', message);
    }

    console.log(message)

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