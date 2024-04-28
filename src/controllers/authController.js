const User = require('../models/userModel')
const Device = require('../models/deviceModel')
const catchAsync = require('../utils/catchAsync')
const jwt = require('jsonwebtoken')
const AppError = require('../utils/appError')
const Email = require('../utils/email')
const {promisify} = require('util')

const signToken = (id,type) => {
    if(type === 'login'){
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    })
}else if(type === 'emailVerification'){
    return jwt.sign({id},process.env.JWT_MAILS_SECRET
        )
}else if(type === 'resetPassword'){
    return jwt.sign({id},process.env.JWT_RESET_SECRET
        )
}
}




const createAndSendToken = (user,statusCode,res,isCreateUser)=>{
    const token = signToken(user._id,'login')

    if(isCreateUser){
    user.password = undefined
    user.isActive = undefined
    res.status(statusCode).json({
        status:"success",
        token,
        data: {
            user: user
        }
   })
}else{
    res.status(statusCode).json({
        status:"success",
        token
   })
}
}


exports.protect = catchAsync(async (req,res,next)=>{
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    }

    if(!token){
        return next(new AppError('You are not logged in!',401))
    } 

    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)

    const currentUser = await User.findById(decoded.id).select('+isActive +relatives')
     
    if(!currentUser || !currentUser.isActive){
        return next(new AppError('The User belongs to this token does no longer exist.',401))
    }

    if(currentUser.isSensitiveDataChangedAfter(decoded.iat)){
        return next(new AppError('User recently changed password or email. Please log in again',401))
    }

    if(!currentUser.isVerified){
        return next(new AppError(`The User belongs to this token isn't verified`,401))
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser
    next()
})
 
exports.signup = catchAsync(async (req,res,next)=>{
    req.body.email = req.body.email.toLowerCase()
    if(req.body.userType == 'relative' && !req.body.relatives){
        return next(new AppError('relative must have a regular user as relative at least',400))
    }
    // if(req.body.userType == 'user' && !req.body.macAddress){
    //     return next(new AppError('user must have a device',400))
    // }
    
        // const decodedtoken = Buffer.from(req.body.macAddress, 'base64').toString();
        // const decoded = await promisify(jwt.verify)(decodedtoken,process.env.JWT_QR_CODE_SECRET)
       const device = await Device.findOne({macAddress:req.body.macAddress})
       
    
    const newUser = await User.create({
        name: req.body.name,
        username: req.body.username,
        phoneNumber: req.body.phoneNumber,
        userType: req.body.userType,
        gender: req.body.gender,
        email: req.body.email ,
        password: req.body.password,
        device: device._id
    })
if(req.body.relatives){
    
    for(let i = 0;i<req.body.relatives.length;i++){
        
        const user = await User.findOneAndUpdate({username:req.body.relatives[i]},{$push:{relatives: newUser}})
        if(user){
        newUser.relatives.push(user)
        }
    }
    await newUser.save()
}
    const token = signToken(newUser.id,'emailVerification')
   
  const base64EncodedToken = Buffer.from(token).toString('base64');
  
  const url = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${base64EncodedToken}`
    new Email(newUser,url).sendEmailVerification()
     
    res.status(201).json({
        status:"success",
        message: 'Email Verification has been send.'
   })
})


exports.verifyAccount = catchAsync(async (req,res,next) => {
    const token = Buffer.from(req.params.token, 'base64').toString();
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_MAILS_SECRET)
   if(decoded.iat + 10 * 60 < Math.ceil(Date.now()/1000)){
    const user = await User.findById(decoded.id)
    const token = signToken(decoded.id,'emailVerification')
    const base64EncodedToken = Buffer.from(token).toString('base64');
    const url = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${base64EncodedToken}`
     new Email(user,url).sendEmailVerification()
    return next(new AppError('This token is expired. Please check your mail box for new link',400))
   }

    const freshUser = await User.findByIdAndUpdate(decoded.id,{isVerified:true}).select('+isActive')

    if(!freshUser || !freshUser.isActive){
        return next(new AppError('The User belongs to this token does no longer exist.',401))
    }

   
    createAndSendToken(freshUser,200,res,true)
})

exports.login = catchAsync(async (req,res,next)=>{
    
    if(!req.body.email  || !req.body.password || !req.body.fcmToken){
      return  next(new AppError(`Please provide email and password and fcmToken`,400))
    }
    req.body.email = req.body.email.toLowerCase()
    
    const user = await  User.findOne({email: req.body.email}).select('+password +isActive')
    if(!user){
        return next(new AppError(`Invalid Credentials`,401))
    }
   if(user.isVerified === false){
    return next(new AppError(`This email isn't verified yet.`,401))
   }
   if(user.isActive === false){
    return next(new AppError(`The User belongs to this email does no longer exist.`,401))
   }
    if(!(await user.isCorrectPassword(req.body.password,user.password))){
        return next(new AppError(`Invalid Credentials`,401))
    }
    user.fcmToken = req.body.fcmToken
    await user.save()

    createAndSendToken(user,200,res,false)
})

exports.deviceLogin = catchAsync(async (req,res,next)=>{
    
    if(!req.body.macAddress){
      return  next(new AppError(`Please provide macAddress`,400))
    }
    const device = await Device.findOne({macAddress: req.body.macAddress})
    if(!device){
        return next(new AppError(`There's no device with his serial number`,404))
       }
   const user = await User.findOne({device:device.id})
   if(user && user.isVerified === false){
    return next(new AppError(`This email isn't verified yet.`,401))
   }
   if(user && user.isActive === false){
    return next(new AppError(`The User belongs to this email does no longer exist.`,401))
   }
    if(!user){
        return next(new AppError(`This device isn't assigned to user yet.`,401))
    }

    createAndSendToken(user,200,res,false)
})

exports.logout = catchAsync(async (req,res,next)=>{
    const user = await User.findByIdAndUpdate(req.user.id,{$unset : {fcmToken:""}},{new:true})
    res.status(200).json({
        status: "success",
        message: "The user logged out successfully."
    })
})

exports.forgotPassword = catchAsync(async(req,res,next)=>{
    req.body.email = req.body.email.toLowerCase()
    const user = await User.findOne({email:req.body.email})
    if(!user){
        return next(new AppError(`There's no user with this email`,404))
    }
    const resetToken = signToken(user.id,'resetPassword')
    const base64EncodedToken = Buffer.from(resetToken).toString('base64');
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${base64EncodedToken}`
    new Email(user,resetUrl).sendPasswordReset()
    res.status(200).json({
        status: "success",
        message: "Token sent to email successfully"
    })


})

exports.resetPassword = catchAsync(async(req,res,next)=>{
    const token = Buffer.from(req.params.token, 'base64').toString();
    const decoded = await promisify(jwt.verify)(token,process.env.JWT_RESET_SECRET)
    if(decoded.iat + 10 * 60 < Math.ceil(Date.now()/1000)){
        const user = await User.findById(decoded.id)
        const token = signToken(decoded.id,'resetPassword')
        const base64EncodedToken = Buffer.from(token).toString('base64');
        const url = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${base64EncodedToken}`
        new Email(user,url).sendPasswordReset()
        return next(new AppError('This token is expired. Please check your mail box for new link',400))
    }

})

exports.updatePassword = catchAsync(async (req,res,next)=>{
    const user = await User.findById(req.user.id).select('+password')
    if(!(await user.isCorrectPassword(req.body.currentPassword,user.password))){
        return next(new AppError('Wrong current password',401))
    }

    user.password = req.body.newPassword

    await user.save()

    createAndSendToken(user,200,res,false,req) 
})

exports.updateEmail = catchAsync(async (req,res,next)=>{
    const user = await User.findById(req.user.id)
   

    user.email = req.body.email.toLowerCase()
   // user.isVerified = false

    await user.save()

    const token = signToken(user.id,'emailVerification')
    const base64EncodedToken = Buffer.from(token).toString('base64');
    const url = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${base64EncodedToken}`
    new Email(user,url).sendEmailVerification()

    res.status(200).json({
        status:"success",
        message: 'Email Verification has been send.'
   })
})

