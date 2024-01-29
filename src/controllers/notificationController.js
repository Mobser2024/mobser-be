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
    const notifiedUser = await User.findById(req.body.userId).select('+fcmToken')
    console.log(notifiedUser)
    if(!notifiedUser){
        return next(new AppError('No user with this id',400))
    }
    if(!notifiedUser.fcmToken){
        return next(new AppError('This user isn\'t logged in',400))
    }
    const message = {
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
        token: notifiedUser.fcmToken
    }
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
    req.user.isActive = undefined
    req.user.relatives = undefined
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
