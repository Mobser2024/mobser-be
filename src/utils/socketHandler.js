const chatController = require('../controllers/chatController')
const userController = require('../controllers/userController')
const mapController = require('../controllers/mapController')

const socketHandler =  (io)=>{
io.on('connection',async (socket)=>{
    console.log(socket.handshake.query.socketStatus)

    const token = socket.handshake.headers.authorization ? socket.handshake.headers.authorization.split(' ')[1]: null;
   
    const currentUser = await userController.assignSocketIdToUser(token,socket,socket.handshake.query.socketStatus)
    console.log(`New websocket connection`)

     if(socket.handshake.query.socketStatus === 'chat'){
    socket.on('sendMessage',(data)=> {
        console.log(data)
        chatController.sendMessage({chatSocketId:socket.id,...data},io)
    })
} else if(socket.handshake.query.socketStatus === 'mapTracking'){
    let isFirstTime = true
    socket.on('changeMyPosition',(data)=> {
        console.log(data)
        mapController.changePosititon(io,data,socket,isFirstTime,currentUser)
        isFirstTime = false
    })
}

    // socket.on('changeSocketStatus',(data)=> {
    //     console.log(data)
    //     userController.changeSocketStatus(socket.id,data.socketStatus)
    // })

    socket.on('disconnect', () => {
        console.log('disconnected')
        userController.removeSocketId(socket.id,socket.handshake.query.socketStatus)
      });
})
}

module.exports = socketHandler