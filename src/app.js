const path = require('path')

const express = require('express')
const http = require('http')
const socketio = require('socket.io')
const cors = require('cors')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const compression = require('compression')
const authRouter = require('./routes/authRoutes')
const userRouter = require('./routes/userRoutes')
const chatRouter = require('./routes/chatRoutes')
const viewRouter = require('./routes/viewRoutes') 
const errorHandler = require('./controllers/errorController')
const chatController = require('./controllers/chatController')
const userController = require('./controllers/userController')
const AppError = require('./utils/appError')
const { default: helmet } = require('helmet')

const app = express()

const server = http.createServer(app)

const io = socketio(server)


app.use(cors())

io.on('connection',(socket)=>{
    console.log(socket)
    const token = socket.handshake.headers.authorization ? socket.handshake.headers.authorization.split(' ')[1]: null;
   
    chatController.assignSocketIdToUser(token,socket)
    console.log(`New websocket connection`)
    socket.on('sendMessage',(data)=> {
        
        chatController.sendMessage({socketId:socket.id,...data},io)
    })
    socket.on('requestTracking',(data)=>{

    })
    socket.on('disconnect', () => {
        console.log('disconnected')
        chatController.removeSocketId(socket.id)
      });
})

// app.set('trust proxy', true);


app.set('view engine', 'pug')
app.set('views',path.join(__dirname, 'views'))

app.use(express.static(path.join(__dirname,'public')))

app.use(helmet())
if(process.env.NODE_ENV === "development"){
app.use(morgan('dev'))
}

const limiter = rateLimit({ 
    max: 100, 
    windowMS: 60 * 60 * 1000,
    message: 'Too many requests from this IP. Please try again in an hour'
}) 
   
app.use('/api',limiter) 

// Body parser, reading data from body into req.body
app.use(express.json({
    limit:'10kb'
}))

app.use(express.urlencoded({ 
    extended: true,
    limit:'10kb' 
}))


// Data sanitization against NoSql query injection
app.use(mongoSanitize())

// Data sanitization against XSS
app.use(xss())


app.use(compression())

app.use('/',viewRouter)
app.use('/api/v1/auth/',authRouter)
app.use('/api/v1/users/',userRouter)
app.use('/api/v1/chats/',chatRouter)


app.all('*',(req,res,next)=>{
    next(new AppError(`can't find ${req.originalUrl}`,404))
})

app.use(errorHandler)

module.exports = server