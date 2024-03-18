const AppError = require('../utils/appError')
const multer = require('multer')
const catchAsync = require('../utils/catchAsync')
const UserImages = require('../models/userImagesModel')
const User = require('../models/userModel')
const s3 = require('../utils/s3')

const multerStorage = multer.memoryStorage()
const multerFilter = (req,file,cb) =>{
    if(file.mimetype.startsWith('image')){
        cb(null,true)
    }else{
       return cb(new AppError('Not an image! Please upload only images.',400))
    }
}
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadUserPhotos = upload.array('photos')
exports.uploadUserPhotosToS3 = catchAsync(async (req,res,next) => {
    console.log(req.files)
    if(!req.files){
        return next(new AppError(`No image to upload`,400))
    }
    req.userImages = []
    for(let i = 0 ; i < req.files.length ; i++){
        req.files[i].filename = `images/face-recognition/user-${req.user.id}-${Date.now()}.png`
        // req.files[i].buffer =  await sharp(req.files[i].buffer)
        // .toFormat('png')
        // .png({ quality: 90})
        // .toBuffer()
        const result =  await s3.uploadFile(req.files[i],'image/png')
        console.log('the s3 result '+ result)
        req.userImages.push(result)
         
    }
    next()
}
)
exports.addImages = catchAsync(async (req,res,next)=>{
    let userImages = await UserImages.findOneAndUpdate({user:req.user.id},{$push: {images: req.userImages}},{new:true})
    if(!userImages) {
        userImages =   await UserImages.create({
            images: req.userImages,
            user: req.user.id,
            name: req.user.name,
            isUser: true
        })
    }

    res.status(201).json({
        status:"success",
        data: {
            userImages
        }
   })
    
})

exports.addRelativeImages = catchAsync(async (req,res,next)=> {
    let userImages = await UserImages.findOneAndUpdate({relatedTo: req.user.id, name: req.body.name}, {$push: {images: req.userImages}},{new:true})
    if(!userImages){
        userImages =   await UserImages.create({
            images: req.userImages,
            relatedTo: req.user.id,
            name: req.body.name,
            isUser: false
        })
    }

    res.status(201).json({
        status:"success",
        data: {
            userImages
        }
   })
})

exports.getNewUserImages = catchAsync(async (req, res, next) => {
    if (req.body.relativeId) {
        const user = await User.findOne({_id: req.user.id, relatives: req.body.relativeId})
        const userImages = await UserImages.findOne({user:req.body.relativeId})
        if (userImages && user) {
            res.status(200).json({
                status:"success",
                data: {
                    userImages
                }
           })
        }else {
            return next(new AppError(`user not found`,404))
        }
    }else {
        const userImagesList = await UserImages.find({relatedTo: req.user.id})
        res.status(200).json({
            status:"success",
            data: {
                userImagesList
            }
       })

    }
})