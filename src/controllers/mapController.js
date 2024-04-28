const User = require('../models/userModel')
const {sendNotification} = require('../utils/fcm')


exports.changePosititon = async (io,data,socket,isFirstTime,currentUser) => {
    
    const toUser = await User.findById(data.to).select('+mapTrackingSocketId +fcmToken')
    if(isFirstTime){
        const fcmMessage = {
            notification: {
                title: `${currentUser.username} Accepted Your Request Tracking`,
                body: `Your relative ${currentUser.name} accepted your tracking request`
            },
            data: {
                id: currentUser.id,
                username: currentUser.username,
                name: currentUser.name,
                notificationType: "tracking",
                long:`${data.long}`,
                lat:`${data.lat}`
            },
            token: toUser.fcmToken 
        }
        sendNotification(fcmMessage)
        const notifiedUser = await User.findByIdAndUpdate(toUser._id,
            { $push: { notifications: fcmMessage } },
            { new: true, useFindAndModify: false ,runValidators:true})
       return 
    }
    console.log(toUser)
    if(toUser.mapTrackingSocketId ){
        console.log('user is online')
       return io.to(toUser.mapTrackingSocketId).emit('userPositionChanged', {long:data.long,lat:data.lat});
    }


    socket.emit('error',`The tracker isn't connected`)
}



