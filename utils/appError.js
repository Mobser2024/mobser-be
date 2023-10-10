class AppError extends Error{
    constructor(message,statusCode){
        super(message)

        this.statusCode = statusCode
        this.status = (statusCode<500 && statusCode>=400) ? 'fail' : 'error'
        this.isOpertional = true

        Error.captureStackTrace(this,this.constructor)
    }
}

module.exports = AppError