const authService = require('./auth.service')
const userService = require('../user/user.service')
const logger = require('../../services/logger.service')
const jwt = require('jsonwebtoken')
const sgMail = require('@sendgrid/mail')
require('dotenv').config()


async function login(req, res) {
    const { email, password } = req.body
    try {
        const user = await authService.login(email, password)
        if (typeof (user) === 'string') {
            res.json(user)
        } else {
            req.session.user = user;
            res.json(user)
        }
    } catch (err) {
        res.status(401).send({ error: err })
    }
}

async function signup(req, res) {
    try {
        const { email, password, fname, lname, emailSends } = req.body
        const user = await authService.signup(email, password, fname, lname, emailSends)
        console.log({ user });
        if (!user) return res.json(user)
        const token = _createToken(user._id)
        console.log({ token });
        sendMailToConfirm(user.email, token, 'confirm')
        res.json(user)
    } catch (err) {
        logger.error('[SIGNUP] ' + err)
        res.status(500).send({ error: 'could not signup, please try later' })
    }
}


function sendMailToConfirm(email, token, type) {
    const fs = require('fs')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)
    const url = `http://www.midot-gdolot.com/#/confirmation/${token}/${type}`;
    const msg = {
        to: email, // Change to your recipient
        from: process.env.email, // Change to your verified sender
        subject: 'אימות מייל',
        html: `
        <div  style="direction:rtl"> 
        <h3 style="text-align:center;">  שלום שמחים שהצטרפתם לאתר - מידות גדולות    </h3>
        <h3  style="text-align:center;">כנס/י ללינק לאימות :</h3> 
      <div  style="text-align:center;margin-bottom:10px;">   <a  href="${url}">הקלק כאן לאימות  והתחברות</a> </div>
       <div  style="text-align:center;">  
       <img style="background-color:#2d383a;width:100px;height:90px;" src="cid:logo"> 
        </div>
        </div>
        `,
        attachments: [{
            filename: 'logo',
            type: 'image/png',
            content_id: 'logo',
            content: fs.readFileSync('logo.png', { encoding: 'base64' }),
            disposition: 'inline',
        }],
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        })
    // Step 2

}



function _createToken(param) {
    return jwt.sign({ data: param }, process.env.emailSecret, { expiresIn: '1d' });
}


async function logout(req, res) {
    try {
        req.session.destroy()
        res.send({ message: 'logged out successfully' })
    } catch (err) {
        res.status(500).send({ error: err })
    }
}


async function forgotPassword(req, res) {
    const { email } = req.params
    try {
        const users = await userService.query()
        const user = users.find(user => user.email === email)
        const token = _createToken(user._id)
        sendMailToConfirm(user.email, token, 'reset')
    } catch (err) {
        console.log({ err });
        throw err
    }

}



module.exports = {
    login,
    signup,
    logout,
    forgotPassword,
    sendMailToConfirm
}