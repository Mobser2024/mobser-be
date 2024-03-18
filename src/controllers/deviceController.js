const Device = require('../models/deviceModel')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const jwt = require('jsonwebtoken')
const qr = require('qrcode'); 
const s3 = require('../utils/s3')

exports.createDevice = catchAsync(async (req,res,next) => {
   
    const newDevice = await Device.create({
        macAddress: req.body.macAddress
    })
    const options = {
        errorCorrectionLevel: 'H', // High error correction level
        type: 'png', // Output format
        quality: 0.9, // Image quality
        margin: 1, // Margin around the QR code
        color: {
          dark: '#000000', // Dark color
          light: '#ffffff' // Light color
        }
      };

      // const deviceToken = jwt.sign({id:newDevice.id},process.env.JWT_QR_CODE_SECRET)
      // const base64EncodedToken = Buffer.from(deviceToken).toString('base64');
      let file
      await qr.toBuffer(req.body.macAddress, options,  async (err, buffer) => {
        // if (err) {
        //     return next(new AppError('You are not logged in!',401))
        // };
         file = {
            buffer,
            filename: `images/qr-codes/${Date.now()}.png`
        }
        console.log(file)

        const result =  await s3.uploadFile(file,'image/png')
      console.log('the s3 result '+ result)
      res.status(201).json({
          status:"success",
          data: {
              url:result
          }
     })
         

      })
      
      


})