

exports.getResetPasswordPage = (req,res,next) => {
    res.locals.resetToken = req.params.token
    res.status(200).render('resetPasswordPage',{
        title:'reset password'
    })
}