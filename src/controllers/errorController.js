const AppError = require('../utils/appError')


const handleCastErrorDB = err =>{
   const message = `Invalid ${err.path}: ${err.value}`
   return new AppError(message,400)
}

const handleDuplicateFieldsDB = err => {
    const message = `Duplicate field ${Object.keys(err.keyValue)[0]}: ${Object.values(err.keyValue)[0]}. Please use another value!`
    return new AppError(message,400)
}

const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message)
    const message = `Invalid input data. ${errors.join('.  ')}`
    return new AppError(message,400)
}

const handleJwtError = () =>{
    const message = 'Invalid token. Please log in again'
    return new AppError(message,401)
}

const handleTokenExpireError = () =>{
    const message = 'Expired Token. Please log in again'
    return new AppError(message,401)
}

const sendErrorDev = (err,req,res) =>{
    if(! (req.originalUrl.startsWith('/api'))){
        console.error('ERROR',err)
        return res.status(err.statusCode).render('error',{
            title:'Something Went Wrong',
            msg: err.message
        })

    }else{
        console.error('ERROR',err)
    return res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}
}

const sendErrorProd = (err,req,res) =>{
    if(! (req.originalUrl.startsWith('/api'))){
        console.error('ERROR',err)
        const msg = err.isOpertional ? err.message : "Try agian later!"
       return res.status(err.statusCode).render('error',{
            title:'Something Went Wrong',
            msg
        })

    }else{
    if(err.isOpertional){
   return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
    })
}else{
   return  res.status(400).json({
        status: 'error',
        message: 'Something went wrong'
    })
}
    }
}

module.exports = (err,req,res,next)=>{
    err.statusCode = err.statusCode || 400
    err.status = err.status || 'error'
    if(process.env.NODE_ENV === 'development'){
       sendErrorDev(err,req,res)
    }else if(process.env.NODE_ENV === 'production'){
        let error = {...err}
        console.log(err.name)
        if(err.name === 'CastError') {
            error = handleCastErrorDB(error)
        }
        if(err.code === 11000){
            error = handleDuplicateFieldsDB(error)
        }
        if(err.name === 'ValidationError') {
            error = handleValidationErrorDB(error)
        }
        if(err.name === 'JsonWebTokenError'){
            error = handleJwtError()
        }
        if(err.name === 'TokenExpiredError'){
            error = handleTokenExpireError()
        }
        sendErrorProd(err,req,res)
    }
    
}