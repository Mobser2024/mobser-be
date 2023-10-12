const express = require("express");

const authController = require('../controllers/authController')



const router = express.Router() 
router.post('/signup',authController.signup)
router.get('/verify-email/:token',authController.verifyAccount)
router.post('/login',authController.login)
// router.get('/logout',authController.logout)
router.post('/forgot-password',authController.forgotPassword)
// router.patch('/reset-password/:token',authController.resetPassword)
router.patch('/update-password',authController.protect,authController.updatePassword)
router.patch('/update-email',authController.protect,authController.updateEmail)

module.exports = router