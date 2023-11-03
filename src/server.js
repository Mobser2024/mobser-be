const mongoose =  require('mongoose')
const dotenv = require("dotenv");
const User = require('./models/userModel')
// const nodemailer = require('nodemailer')
// const kue = require('kue');
// const pug = require('pug')
// const queue = kue.createQueue({redis: {
//     port: 6379,
//     host: 'redis'
//   }});



process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION  Shutting down...')
    console.log(err.name,err.message)
        process.exit(1)
})

dotenv.config({ path: './config.env' });
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
   await User.updateMany({},{$unset : {socketId:"",socketStatus:""}})
})

process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJeCTION Shutting down...')
    console.log(err)
    server.close(()=>{
        process.exit(1)
    })
})

