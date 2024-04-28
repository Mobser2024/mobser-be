const mongoose =  require('mongoose')
const dotenv = require("dotenv");
const User = require('./models/userModel')

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION  Shutting down...')
    console.log(err.name,err.message,err)
        process.exit(1)
})

dotenv.config({ path: '../config.env' });
const DB = process.env.DATABASE_URL
mongoose.connect(DB,{
    useNewUrlParser : true
}).then(con =>{
    // console.log(con.connections)
     console.log("DB connect successfully")
})


const app = require('./app');

const port = process.env.PORT || 3000;   


const server = app.listen(port,
    ()=>{
        console.log(`app is running on port : ${port}`)
        //console.log(Date.now())
    })
 

server.on('close',async ()=>{
    console.log('server is closed')
   await User.updateMany({},{$unset : {chatSocketId:"",mapTrackingSocketId:""}})
})

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJeCTION Shutting down...')
    console.log(err)
    server.close(()=>{
        process.exit(1)
    })
})

