const mongoose = require("mongoose");


const deviceSchema = mongoose.Schema({
   serialNumber: {
    type: String,
    required: [true,`You must provide a serial number`],
    unique: [true, 'This serial number is already in use'],
   },
    createdAt: { 
        type: Date,
        default: new Date()
    }
})

const Device = mongoose.model('Device',deviceSchema)
module.exports = Device 