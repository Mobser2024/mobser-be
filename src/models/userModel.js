const mongoose = require("mongoose");
const validator = require('validator')
const bcrypt = require('bcryptjs')
const AppError = require('../utils/appError')


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
    relatedUsers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
    }],
    gender: {
        type: String,
        required: [true, 'The user must have a gender'],
        enum: ['male','female']
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: { 
        type: Date,
        default: new Date(Date.now())
    },
    passwordChangedAt: Date,
    
    isActive: {
        type: Boolean,
        default: true,
        select: false
    },
    socketId: String
})

userSchema.pre('save',async function(next){
    if(this.isModified('password')){
     this.password = await bcrypt.hash(this.password, 12)
     if(!this.isNew){
        this.passwordChangedAt = Date.now() - 1000
     }
    }
    return next()
})

userSchema.pre('save',async function(next){
    if(this.relatedUsers){
     this.relatedUsers = await Promise.all(this.relatedUsers.map(async (el) => {
        return await User.findOne({username : el})._id
     }))
    }
    return next()
})

userSchema.pre('save',async function(next){
    // Remove spaces and convert the full name to lowercase
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
  next()
})

userSchema.post('save',async function(doc){
    await User.updateMany({_id: {
        $in: doc.relatedUsers
     }},{
     relatedUsers: {
        $push: doc._id

     }}
     )
})

userSchema.methods.isCorrectPassword = async function(candidatePassword,userPassword){
    return await bcrypt.compare(candidatePassword,userPassword)
}

userSchema.methods.isPasswordChangedAfter =  function(jwtTimeStamp){
    
    //False means that password not changed after the token which is ok
    if(this.passwordChangedAt){
        return jwtTimeStamp < Math.ceil(this.passwordChangedAt.getTime()/1000)
    }
    return false
}

const User = mongoose.model('User',userSchema)
module.exports = User 