const express = require("express");

const authController = require('../controllers/authController')
const chatController = require('../controllers/chatController')



const router = express.Router() 
router.get('/get-messages/:userId',authController.protect,chatController.getMessages) 
router.post('/send-message/',authController.protect,chatController.sendMessage) 
router.post('/upload-image',authController.protect,chatController.uploadPhoto,chatController.uploadPhotoToS3) 
router.post('/upload-audio',authController.protect,chatController.uploadAudio,chatController.uploadAudioToS3) 

module.exports = router