const User = require('../models/userModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const {promisify} = require('util')
const {sendNotification} = require('../utils/fcm')

exports.sendRequestTrackingNotification = catchAsync(async (req,res,next)=>{
    if(!req.body.userId){
        return next(new AppError('Please provide userId',400))
    }
    if(!req.user.relatives.includes(req.body.userId)){
        return next(new AppError('This user isn\'t your relative',400))
    }
    let message = {
        notification: {
            title: 'Request Tracking',
            body: `Your relative ${req.user.name} wants to track you.`
        },
        data: {
            id: req.user.id,
            username: req.user.username,
            name: req.user.name,
            notificationType: "tracking"
        },
    }
    const notifiedUser = await User.findByIdAndUpdate(req.body.userId,
        { $push: { notifications: message } },
        { new: true, useFindAndModify: false ,runValidators:true}).select('+fcmToken')
    console.log(notifiedUser)
    
    if(!notifiedUser){
        return next(new AppError('No user with this id',400))
    }
    
     
    if(!notifiedUser.fcmToken){
        return next(new AppError('This user isn\'t logged in',400))
    }
   message.token = notifiedUser.fcmToken
    
    sendNotification(message)

    res.status(200).json({
        status:"success",
        message: 'Request tracking notification sent.'
    })
})

exports.acceptTrackingNotification = catchAsync(async (req,res,next)=>{
    if(!req.body.userId){
        return next(new AppError('Please provide userId',400))
    }
    if(!req.user.relatives.includes(req.body.userId)){
        return next(new AppError('This user isn\'t your relative',400))
    }
    const notifiedUser = await User.findById(req.body.userId).select('+fcmToken')
    if(!notifiedUser.fcmToken){
        return next(new AppError('This user isn\'t logged in',400))
    }
    const message = {
        notification: {
            title: 'Accept Tracking',
            body: `Your relative ${req.user.name} accepted your tracking request.`
        },
        data: {
            id: req.user.id,
            username: req.user.username,
            name: req.user.name,
            notificationType: "tracking"
        },
        token: notifiedUser.fcmToken
    }
    sendNotification(message)
    res.status(200).json({
        status:"success",
        message: 'Accept tracking notification sent.'
   })
    
})

exports.imagesProcessedNotification = catchAsync(async (req, res, next) => {
    const relativesIds = req.user.relatives
    for(let relativeId of relativesIds){
        const notifiedUser = await User.findById(relativeId).select('+fcmToken +nottifications')
        let message = {
            notification: {
                title: `Images Processed`,
                body: `Your relative ${req.user.name} has uploaded his images.`
            },
            data: {
                id: req.user.id,
                username: req.user.username,
                name: req.user.name,
                notificationType: "image_processing",
                link: req.body.link,
            },
        }
        if(notifiedUser.fcmToken){
            sendNotification({
                ...message,
                token: notifiedUser.fcmToken, // Add the new field here
              })
        }
        notifiedUser.notifications.push(message)
        await notifiedUser.save()

    }

})


