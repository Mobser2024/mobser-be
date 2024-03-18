const express = require("express");

const userImagesController = require('../controllers/userImagesController')
const authController = require('../controllers/authController')



const router = express.Router() 
router.post('/add-images',authController.protect,userImagesController.uploadUserPhotos,userImagesController.uploadUserPhotosToS3,userImagesController.addImages)
router.post('/add-relative-images',authController.protect,userImagesController.uploadUserPhotos,userImagesController.uploadUserPhotosToS3,userImagesController.addRelativeImages)
router.get('/get-new-images',authController.protect,userImagesController.getNewUserImages)


module.exports = router