const mongoose = require("mongoose");
const validator = require('validator')
const bcrypt = require('bcryptjs')


const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true,'The user must have a name']
    },
    username: {
        type: String,
        unique: [true, 'This username is already in use'],
        validate: {
            validator: function(el){
                const regex = /\s/;
                return !regex.test(el);
            },
            message: `Username must have no spaces`
        },
    },
    photo: {
        type: String
    },
    phoneNumber: {
        type: String,
        unique: [true, 'This phone number is already in use'],
        required: true,
        validate: [validator.isMobilePhone,`Invalid phone number.`],
    },
    email: {
        type: String,
        required: true,
        unique: [true, 'This email is already in use'],
        lowerCase: true,
        validate: [validator.isEmail,`Please enter valid email`],
    },
    password: {
        type: String,
        required: [true, 'The user must have a password'],
        validate: [validator.isStrongPassword,`Password must be strong.`],
        select:false
    },
    userType: {
        type: String,
        required: [true, 'The user must have a type'],
        enum : ['user','relative'],
    },
    relatives: {
        type: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        
    }],
    select: false
    },
    notifications: {
        type: [{
            notification: {
                title: String,
                body: String,
            },
            data: {
                id: String,
                username: String,
                name: String,
                notificationType: {
                    type: String,
                    required: [true, 'The notification must have a type'],
                    enum : ['chat','tracking'],
                },
            },
            createdAt: { 
                type: Date,
                default: new Date()
            }
            
    }],
    select: false
    },
    gender: {
        type: String,
        required: [true, 'The user must have a gender'],
        enum: ['male','female']
    },
    addressLocation: {
        type: {
          type: String, 
          enum: ['Point'], 
        },
        coordinates: {
          type: [Number]
        }
      },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: { 
        type: Date,
        default: new Date(Date.now())
    },
    sensitiveDataChangedAt: {
        type: Date,
        select: false
    
    },
    isActive: {
        type: Boolean,
        default: true,
        select: false
    },
    chatSocketId: {
        type: String,
        select: false
    },
    mapTrackingSocketId: {
        type: String,
        select: false
    },
    deviceSocketId: {
        type: String,
        select: false
    },
    fcmToken: {
        type: String,
        unique: [true, 'This fcm token is already in use'],
        select: false 
    },
    device: {
        type: mongoose.Schema.ObjectId,
        ref: 'Device',
        select: false
   },
})

userSchema.pre('save',async function(next){
    if(this.isModified('password')){
     this.password = await bcrypt.hash(this.password, 12)
     if(!this.isNew){
        this.sensitiveDataChangedAt = Date.now() - 1000
     }
    }
    return next()
})

userSchema.pre('save',async function(next){
    if(this.isModified('email')){
     this.isVerified = false
     if(!this.isNew){
        this.sensitiveDataChangedAt = Date.now() - 1000
     }
    }
})

userSchema.pre('save',async function(next){
    // Remove spaces and convert the full name to lowercase
    if(!this.username){
  const cleanedName = this.name.replace(/\s/g, '').toLowerCase();
  let username = cleanedName
  let userExist = true
  let suffix = 0

  while(userExist){
    const existingUser = await User.findOne({ username });
    if(!existingUser){
        break
    }
    suffix++ 
    username = `${cleanedName}${suffix}`
  }
  this.username = `${username}`;
}
  next()
})



userSchema.methods.isCorrectPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword)
}

userSchema.methods.isSensitiveDataChangedAfter =  function(jwtTimeStamp){
    
    //False means that password not changed after the token which is ok
    if(this.sensitiveDataChangedAt){
        return jwtTimeStamp < Math.ceil(this.sensitiveDataChangedAt.getTime()/1000)
    }
    return false
}

const User = mongoose.model('User',userSchema)
module.exports = User 