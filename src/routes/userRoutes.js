const express = require("express");

const authController = require('../controllers/authController')
const userController = require('../controllers/userController')



const router = express.Router() 

router.route('/me').get(authController.protect,userController.getMe)
.patch(authController.protect,userController.uploadUserPhoto,userController.uploadUserPhotoToS3,userController.updateMe)
.delete(authController.protect,userController.deleteMe)

router.patch('/add-relative',authController.protect,userController.addRelativeUser)

router.route('/relatives').get(authController.protect,userController.getRelatives)

router.get('/check-user/:username',userController.checkUsername)
router.get('/me/notifications',authController.protect,userController.getMyNotifications)
router.get('/me/read-notifications',authController.protect,userController.readMyNotifications)

module.exports = router