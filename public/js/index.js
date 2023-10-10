const axios = require('axios')

console.log('anything')

const resetPasswordForm = document.querySelector('.form-reset-password')


if(resetPasswordForm){
    try{
    console.log(res.locals)
    resetPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();
        const newPassword = document.getElementById('newpassword').value;
        const data = {password:newPassword}
        const url = `/api/v1/auth/reset-password/`
        
        const res = await axios({
            method: 'PATCH',
            url,
            data
          });
            console.log(res.data.status)
      });
    }catch (err) {
       console.log(err)
      }
}
