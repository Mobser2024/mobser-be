const multer = require('multer')
const sharp = require('sharp')
const User = require('../models/userModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const {promisify} = require('util')
const jwt = require('jsonwebtoken')
const { relative } = require('path')
const s3 = require('../utils/s3')

const multerStorage = multer.memoryStorage()
const multerFilter = (req,file,cb) =>{
    if(file.mimetype.startsWith('image')){
        cb(null,true)
    }else{
       return cb(new AppError('Not an image! Please upload only images.',400))
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadUserPhoto = upload.single('photo')
exports.uploadUserPhotoToS3 = catchAsync(async (req,res,next) => {
    if(!req.file){
        return next()
    }
    req.file.filename = `images/profiles/user-${req.user.id}-${Date.now()}.png`
   
  
    req.file.buffer =  await sharp(req.file.buffer)
    .resize(500,500).
    toFormat('png')
    .png({ quality: 90})
    .toBuffer()
    const result =  await s3.uploadFile(req.file,'image/png')

    console.log('the s3 result '+ result)
    next()
}
)

const filterObj = (obj,...allowedFields) =>{
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)){
            newObj[el] = obj[el]
        }
    })
    return newObj

}

exports.getMe = catchAsync(async (req,res,next)=>{
    req.user.isActive = undefined
    req.user.relatives = undefined
    res.status(200).json({
        status:"success",
        data: {
            user:req.user
        }
   })
})


exports.updateMe = catchAsync(async (req,res,next) => {
    if(req.body.password || req.body.email){
        return next(new AppError(`This route isn't for update password or email. Please use /auth/update-password. or /auth/update-email`,400))
    }

    const filteredBody = filterObj(req.body,'name','username','gender','phoneNumber','addressLocation','photo')
    if(req.file) {
        filteredBody.photo = `${process.env.AWS_S3_BASE_URL}/${req.file.filename}`
    }
 
    const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody,{
        new:true,
        runValidators:true
    })


    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    })


})

exports.updaateMyLastActivity = async (socketId)=>{
     return await User.findOneAndUpdate({socketId},{lastActivity:new Date(Date.now())})
}

exports.addRelativeUser = catchAsync(async (req,res,next)=>{
    const user = await User.findById(req.user.id).select('+relatives')
  for(let i = 0;i<req.body.relatives.length;i++){
    const relative = await User.findOne({username:req.body.relatives[i]}).select('+relatives')
    console.log(relative)
    if(relative && !user.relatives.includes(relative._id)){
    user.relatives.push(relative)
    relative.relatives.push(user)
    await relative.save()
    }
    }
    await user.save()
    res.status(200).json({
        status: "success",
        data: {
            user
        }
    })
})

exports.getRelatives = catchAsync(async (req,res,next)=>{
        const user = await User.findById(req.user.id).populate({
            path: 'relatives',
            select: 'name username phoneNumber email'
        })

     const relatives =  user.relatives
     res.status(200).json({
        status: "success",
        data: {
            relatives
        }
    })
    
})


exports.deleteMe = catchAsync(async (req,res,next)=>{
    await User.findByIdAndUpdate(req.user.id,{isActive: false})

    res.status(204).json({
        status: "success"
    })
})

exports.checkUsername = catchAsync(async (req,res,next) => {
    const user = await User.findOne({username: req.params.username})
    if(!user){
        return next(new AppError("No user with this username",404))
        
    }
    res.status(200).json({
        status: "success",
        message: "user found"
    })
})

exports.assignSocketIdToUser = async (token,socket,socketStatus)=> {
    try{
    if(!token){
       socket.emit('error',`You are not logged in!`)
        return socket.disconnect()
    }
    if(!socketStatus){
        socket.emit('error',`You must assign status for this socket`)
        return socket.disconnect()
     }

    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)
    if(socketStatus === 'chat'){
        return await User.findByIdAndUpdate(decoded.id,{chatSocketId:socket.id},{new:true}).select('+relatives')
    }else if(socketStatus === 'mapTracking'){
         return await User.findByIdAndUpdate(decoded.id,{mapTrackingSocketId:socket.id},{new:true}).select('+relatives')
    }else{
        socket.emit('error',`You must assign valid status for this socket`)
        return socket.disconnect()
    }
}catch(e){
    console.log(e)
    socket.emit('error',`Something went wrong`)
    return socket.disconnect()
}

}



exports.removeSocketId = async (socketId,socketStatus) => {
    if(socketStatus === 'chat'){
    const user = await User.findOneAndUpdate({chatSocketId:socketId},{$unset : {chatSocketId:""}},{new:true})
    }else if(socketStatus === 'mapTracking'){
    const user = await User.findOneAndUpdate({mapTrackingSocketId:socketId},{$unset : {mapTrackingSocketId:""}},{new:true})
    }
}