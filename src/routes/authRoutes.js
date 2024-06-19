const express = require("express");

const authController = require('../controllers/authController')



const router = express.Router()  
router.post('/signup',authController.signup)
router.get('/successPage', (req, res) => {
  res.send('<h1>Email Verified Successfully!</h1>');
});
router.get('/verify-email/:token',authController.verifyAccount)
router.post('/login',authController.login)
router.post('/device-login',authController.deviceLogin)
router.get('/logout',authController.protect,authController.logout)
router.post('/forgot-password',authController.forgotPassword)
router.post('/reset-password/:token',authController.resetPassword)
router.patch('/update-password',authController.protect,authController.updatePassword)
router.patch('/update-email',authController.protect,authController.updateEmail)

module.exports = router