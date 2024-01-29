const User = require('../models/userModel')
const Message = require('../models/messageModel')
const jwt = require('jsonwebtoken')
const catchAsync = require('../utils/catchAsync')
const {promisify} = require('util')
const {sendNotification} = require('../utils/fcm')

const s3 = require('../utils/s3')
const multer = require('multer')
const sharp = require('sharp')
const AppError = require('../utils/appError')

exports.sendMessage = async (data,io,currentUser) => {
    try{
    console.log(data)
    // const currentUser = await User.findOne({chatSocketId: data.chatSocketId}).select('+isActive')
    if(!currentUser){
        return io.to(data.chatSocketId).emit('error', 'The User belongs to this token does no longer exist.');
      
    }
    if(!currentUser.relatives.includes(data.to)){
        return io.to(data.chatSocketId).emit('error','This user isn\'t your relative')
    }
    const toUser = await User.findById(data.to).select('+chatSocketId +socketStatus +fcmToken')
    if(!toUser){
        return io.to(data.chatSocketId).emit('error','No user with this id')
    }

    //TODO handle message data not in db
    currentUser.relatives = undefined
    // currentUser.isActive = undefined
    const message = await Message.create({
        from:currentUser._id,
        to: toUser._id,
        message: data.message,
        messageType:data.messageType,
        createdAt: new Date(Date.now())
    })
    console.log(toUser)
    if(toUser.chatSocketId ){
        console.log('user is online') 
        return io.to(toUser.chatSocketId).emit('message', message);
    }
    if(!toUser.fcmToken){
        return io.to(data.chatSocketId).emit('error','This user isn\'t logged in')
    }
    const fcmMessage = {
        notification: {
            title: `Message from ${currentUser.name}`,
            body: message.message
        },
        data: {
            id: currentUser.id,
            username: currentUser.username,
            name: currentUser.name,
            notificationType: "chat"
        },
        token: toUser.fcmToken
    }
    sendNotification(fcmMessage)
    console.log(message)
}catch(e){
    console.log(e)
    return io.to(data.chatSocketId).emit('error', 'Something went wrong');
}

}

// exports.getMessages = catchAsync(async (req,res,next)=>{
    
//     const conditionA = {$and:[{from:req.user.id},{to:req.params.userId}]}
//     const conditionB = {$and:[{to: req.user.id},{from:req.params.userId}]}
//     const messages = await Message.find({
//         $or: [conditionA,conditionB]
//     }).sort({ createdAt: -1 })
//     res.status(200).json({
//         status:"success",
//         data: {
//             messages
//         }
//    })
// })

exports.getMessages = catchAsync(async (req,res,next)=>{
    const { page = 1, limit = 20 } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);

    // Calculate skip value for pagination
    const skip = (pageNumber - 1) * limitNumber;

    // Use the Mongoose model to find matching documents in the database with pagination
      const conditionA = {$and:[{from:req.user.id},{to:req.params.userId}]}
      const conditionB = {$and:[{to: req.user.id},{from:req.params.userId}]}
      const messages = await Message.find({
          $or: [conditionA,conditionB]
      }).sort({ createdAt: -1 }).skip(skip)
      .limit(limitNumber);
      res.status(200).json({
          status:"success",
          data: {
              messages
          }
     })
})
const multerStorage = multer.memoryStorage()
const multerFilter = (req,file,cb) =>{
    console.log(file.mimetype)

    if(file.mimetype.startsWith('image')){
        cb(null,true)
    }else{
       return cb(new AppError('Not an image! Please upload only images.',400))
    }
}
const multerFilterForAudio = (req,file,cb) =>{
    console.log(file.mimetype)
    if(file.mimetype.startsWith('audio')){
        cb(null,true)
    }else{
       return cb(new AppError('Not an audio! Please upload only images.',400))
    }
}
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})
const uploadForAudio =  multer({
    storage: multerStorage,
    fileFilter: multerFilterForAudio
})
exports.uploadPhoto = upload.single('photo')
exports.uploadAudio = uploadForAudio.single('audio')
exports.uploadPhotoToS3 = catchAsync(async (req,res,next) => {
    if(!req.file){
        return next(new AppError(`No image to upload`,400))
    }
    req.file.filename = `images/messages/message-${req.user.id}-${Date.now()}.png`
   
  
    req.file.buffer =  await sharp(req.file.buffer)
    .resize(500,500).
    toFormat('png')
    .png({ quality: 90})
    .toBuffer()
    const result =  await s3.uploadFile(req.file,'image/png')

    console.log('the s3 result '+ result)
    res.status(201).json({
        status:"success",
        data: {
            url:result
        }
   })
}
)
exports.uploadAudioToS3 = catchAsync(async (req,res,next) => {
    if(!req.file){
        return next(new AppError(`No audio to upload`,400))
    }
    req.file.filename = `audios/messages/message-${req.user.id}-${Date.now()}.mp3`
   
  
    // req.file.buffer =  await sharp(req.file.buffer)
    // .resize(500,500).
    // toFormat('mp3')
    // .mp3({ quality: 90})
    // .toBuffer()
    const result =  await s3.uploadFile(req.file,'audio/mpeg')

    console.log('the s3 result '+ result)
    res.status(201).json({
        status:"success",
        data: {
            url:result
        }
   })
}
)

