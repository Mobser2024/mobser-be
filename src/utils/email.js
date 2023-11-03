const nodemailer = require('nodemailer')
const pug = require('pug')
const kue = require('kue');
const queue = kue.createQueue({redis: {
    port: 6379,
    host: 'redis'
  }});


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

     send(template,subject){
        queue.process('sendEmail', (job, done) => {
       
            const {subject,template,to,from,url,firstname} = job.data;
   
             // Render HTML using pug
           const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`,{
             firstname,
             url,
             subject
         })
   
             // Define mail options
         const mailOptions = {
             from,
             to,
             subject,
             html,
             text: ` Hi ${this.firstname},\n
              Please click the link to verify this email.: ${this.url} .`
         }
   
             // create transport and send email
         this.newTransport().sendMail(mailOptions,(error, info) => {
             if (error) {
               console.error('Email sending error:', error);
               done(error);
             } else {
               console.log('Email sent:', info.response);
               done();
             }
           })
     })
        
    }

     sendWelcome(){
        // Create a new email sending job
        const emailJob = queue.create('sendEmail', {
            subject: 'Welcome to the Mobser family!',
            template: 'welcome',
            to: this.to,
            from: this.from,
            url: this.url,
            firstname: this.firstname
          }).attempts(5);
          
          emailJob.save((error) => {
            if (!error) {
              console.log('Email job added to the queue.');
            }
          });
       this.send('welcome', 'Welcome to the Mobser family!')
    }

     sendPasswordReset(){

        const emailJob = queue.create('sendEmail', {
            subject: 'Your password reset token (valid for only 10 min',
            template: 'resetPassword',
            to: this.to,
            from: this.from,
            url: this.url,
            firstname: this.firstname
          }).attempts(5);
          
          emailJob.save((error) => {
            if (!error) {
              console.log('Email job added to the queue.');
            }
          });
         this.send('resetPassword', 'Your password reset token (valid for only 10 min')
    }

     sendEmailVerification(){
        const emailJob = queue.create('sendEmail', {
            subject: 'Your email verification link (valid for only 10 min)',
            template: 'emailVerification',
            to: this.to,
            from: this.from,
            url: this.url,
            firstname: this.firstname
          }).attempts(5);
          
          emailJob.save((error) => {
            if (!error) {
              console.log('Email job added to the queue.');
            }
          });
         this.send('emailVerification','Your email verification link (valid for only 10 min)')
    }
}


