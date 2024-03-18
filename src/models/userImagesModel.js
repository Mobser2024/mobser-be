const mongoose = require("mongoose");


const userImagesSchema = mongoose.Schema({
    images: {
        type: [String]
    },
    name: {
        type: String
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        unique: true
    },
    relatedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    },
    isNewImages: {
        type: Boolean,
        default: true
    },
    isUser: {
        type: Boolean
    },
    createdAt: { 
        type: Date,
        default: new Date()
    }
})

const UserImages = mongoose.model('UserImages',userImagesSchema)
module.exports = UserImages 