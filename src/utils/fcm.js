const admin = require('firebase-admin')
const fcm = require('fcm-notification')
const AppError = require('../utils/appError')

const serviceAccount = require('../config/push-notification-key.json')
const certPath = admin.credential.cert(serviceAccount)
const FCM = new fcm(certPath)

exports.sendNotification = (message)=>{
    try{
    FCM.send(message, function(err,response){
        if(err){
            console.log(err)
        //    throw err
        }
    })
}catch(e){}
}