const express = require("express");

const authController = require('../controllers/authController')
const notificationController = require('../controllers/notificationController')

const router = express.Router() 
router.post('/request-tracking',authController.protect,notificationController.sendRequestTrackingNotification) 

module.exports = router