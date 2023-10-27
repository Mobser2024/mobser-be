const User = require('../models/userModel')

exports.requestTracking = async () =>{
    //send notification
}

exports.changePosititon = async (io,data,socket) => {
    const toUser = await User.findById(data.to).select('+socketId +socketStatus')
    if(toUser.socketId && (toUser.socketStatus === 'mapTracking' || toUser.socketStatus === 'chatAndMapTracking')){
        console.log('user is online')
       return io.to(toUser.socketId).emit('userPositionChanged', {long:data.long,lat:data.lat});
    }

    socket.emit('error',`The tracker disconnected`)
}

exports.rejectTracking = async (io,data) => {
    const toUser = await User.findById(data.to).select('+socketId +socketStatus')
    if(toUser.socketId && (toUser.socketStatus === 'mapTracking' || toUser.socketStatus === 'chatAndMapTracking')){
        console.log('user is online')
       return io.to(toUser.socketId).emit('error', 'The user reject your request');
    }
}

