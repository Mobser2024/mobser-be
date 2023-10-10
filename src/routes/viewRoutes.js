const express = require("express");

const viewController = require('../controllers/viewController')



const router = express.Router() 

router.get('/reset-password/:token',viewController.getResetPasswordPage)

module.exports = router