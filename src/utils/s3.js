const AWS = require('aws-sdk')

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    signatureVersion: 'v4',
    // region: 'Europe (Stockholm) eu-north-1',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  })

exports.uploadFile = async (file)=>{
   
   await s3.upload({
        Body: Buffer.from(file.buffer),
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key:file.filename,
        ContentType: 'image/png', // Set the appropriate content type for your image
    }).promise()

    await s3.putObjectAcl({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key:file.filename,
        ACL: 'public-read',
    }).promise()
    const result = `https://mobser-files.s3.eu-north-1.amazonaws.com/${file.filename}`
    //console.log(result)


    return result
}
