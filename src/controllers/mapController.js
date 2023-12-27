const User = require('../models/userModel')
const {sendNotification} = require('../utils/fcm')


exports.changePosititon = async (io,data,socket,isFirstTime,currentUser) => {
    const toUser = await User.findById(data.to).select('+mapTrackingSocketId +fcmToken')
    if(isFirstTime){
        const fcmMessage = {
            notification: {
                title: `${currentUser.username} Accepted Your Request Tracking`
            },
            data: {
                userId: currentUser.id,
                notificationType: "tracking",
                long:`${data.long}`,
                lat:`${data.lat}`
            },
            token: toUser.fcmToken
        }
       return sendNotification(fcmMessage)
    }
    if(toUser.mapTrackingSocketId ){
        console.log('user is online')
       return io.to(toUser.mapTrackingSocketId).emit('userPositionChanged', {long:data.long,lat:data.lat});
    }


    socket.emit('error',`The tracker isn't connected`)
}



