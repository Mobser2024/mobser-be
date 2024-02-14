const express = require("express");

const deviceController = require('../controllers/deviceController')

const router = express.Router() 
router.post('/',deviceController.createDevice) 

module.exports = router