const nodemailer = require('nodemailer')
const pug = require('pug')

module.exports = class email {
    constructor(user,url){
        this.to = user.email,
        this.firstname = user.name.split(' ')[0]
        this.from = `Hazem Hamdy <${process.env.EMAIL_FROM}>`
        this.url = url
    }

    newTransport(){
        if(process.env.NODE_ENV === 'production'){
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD 
                }
            })
        }
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT ,
            auth: {
                user:process.env.EMAIL_USERNAME,
                pass:process.env.EMAIL_PASSWORD
            }
        })
    }

    async send(template,subject){
        // Render HTML using pug
        console.log(this.firstname)
        const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
            firstname: this.firstname,
            url: this.url,
            subject
        })

        // Define mail options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: ` Hi ${this.firstname},\n
             Please click the link to verify this email.: ${this.url} .`
        }

        // create transport and send email
        await this.newTransport().sendMail(mailOptions)
       
    }

    async sendWelcome(){
      await  this.send('welcome', 'Welcome to the Mobser family!')
    }

    async sendPasswordReset(){
        await this.send('resetPassword', 'Your password reset token (valid for only 10 min')
    }

    async sendEmailVerification(){
        await this.send('emailVerification','Your email verification link (valid for only 10 min)')
    }
}


