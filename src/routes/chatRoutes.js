const express = require("express");

const authController = require('../controllers/authController')
const chatController = require('../controllers/chatController')



const router = express.Router() 
router.get('/get-messages/:userId',authController.protect,chatController.getMessages) 

module.exports = router