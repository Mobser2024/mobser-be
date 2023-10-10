const User = require('../models/userModel')
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

// const sendVarificationCode = (to,code,next) => {
    
//     const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

//     const messageParams = {
//         body: `Your verification code is: ${code}`,
//         from: '+19543200219',
//         to // The recipient's phone number
//       };

//     client.messages.create(messageParams)
//     .then((message)=> console.log(`message sent: ${message}`))
//     .catch((err) => {
//         console.error(`Error in sending message: ${err}`)
//         return next(new AppError(err,500))
//     })
// }


exports.protect = catchAsync(async (req,res,next)=>{
    let token
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    }

    if(!token){
        return next(new AppError('You are not logged in!',401))
    }

    const decoded = await promisify(jwt.verify)(token,process.env.JWT_SECRET)

    const currentUser = await User.findById(decoded.id)

    if(!currentUser || !currentUser.isActive){
        return next(new AppError('The User belongs to this token does no longer exist.',401))
    }

    if(currentUser.isPasswordChangedAfter(decoded.iat)){
        return next(new AppError('User recently changed password. Please log in again',401))
    }

    if(!currentUser.isVerified){
        return next(new AppError(`The User belongs to this token isn't verified`,401))
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser
    next()
})

exports.signup = catchAsync(async (req,res,next)=>{
    const newUser = await User.create({
        name: req.body.name,
        username: req.body.username,
        phoneNumber: req.body.phoneNumber,
        userType: req.body.userType,
        gender: req.body.gender,
        email: req.body.email ,
        password: req.body.password,
    })
    const token = signToken(newUser.id,'emailVerification')
  const base64EncodedToken = Buffer.from(token).toString('base64');
  console.log(base64EncodedToken)
  const url = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${base64EncodedToken}`
   await new Email(newUser,url).sendEmailVerification()
     
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
     await new Email(user,url).sendEmailVerification()
    return next(new AppError('This token is expired. Please check your mail box for new link',400))
   }

    const freshUser = await User.findByIdAndUpdate(decoded.id,{isVerified:true})

    if(!freshUser){
        return next(new AppError('The User belongs to this token does no longer exist.',401))
    }

   
    createAndSendToken(freshUser,200,res,true)
})

exports.login = catchAsync(async (req,res,next)=>{
    
    if(!req.body.email  || !req.body.password){
      return  next(new AppError(`Please provide email and password`,400))
    }
    const user = await  User.findOne({email: req.body.email,isActive:true,isVerified:true}).select('+password') 

    if(!user || !(await user.isCorrectPassword(req.body.password,user.password))){
        return next(new AppError(`Invalid Credentials`,401))
    }

    createAndSendToken(user,200,res,false)
})

exports.forgotPassword = catchAsync(async(req,res,next)=>{
    const user = await User.findOne({email:req.body.email})
    if(!user){
        return next(new AppError(`There's no user with this email`,404))
    }
    const resetToken = signToken(user.id,'resetPassword')
    const base64EncodedToken = Buffer.from(resetToken).toString('base64');
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${base64EncodedToken}`
    await new Email(user,resetUrl).sendPasswordReset()
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
        await new Email(user,url).sendPasswordReset()
        return next(new AppError('This token is expired. Please check your mail box for new link',400))
    }

})

exports.updatePassword = catchAsync(async (req,res,next)=>{
    const user = await User.findById(req.user.id).select('+password')
    if(!(await user.isCorrectPassword(req.body.currentPassword,user.password))){
        return next(new AppError('Invalid current password',401))
    }

    user.password = req.body.newPassword

    await user.save()

    createAndSendToken(user,200,res,false,req)


})

