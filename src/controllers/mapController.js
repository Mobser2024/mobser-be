const User = require('../models/userModel')


exports.changePosititon = async (io,data,socket) => {
    const toUser = await User.findById(data.to).select('+mapTrackingSocketId')
    if(toUser.mapTrackingSocketId ){
        console.log('user is online')
       return io.to(toUser.mapTrackingSocketId).emit('userPositionChanged', {long:data.long,lat:data.lat});
    }

    socket.emit('error',`The tracker disconnected`)
}



