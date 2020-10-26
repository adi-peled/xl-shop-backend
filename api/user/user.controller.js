const userService = require('./user.service')
const logger = require('../../services/logger.service')
const authService = require('../auth/auth.service');
const authController = require('../auth/auth.controller')
const jwt = require('jsonwebtoken')
const bcrypt = require("bcryptjs")

const nodemailer = require("nodemailer");
const { getById } = require('./user.service');
const { logout } = require('../auth/auth.controller');
require('dotenv').config()
console.log(process.email, process.pass);
async function getUser(req, res) {
    const user = req.session.user
    res.send(user)
}


async function forgotPassword(req, res) {
    const { email } = req.query
    try {
        const users = await userService.query()
        const user = users.find(u => u.email === email)
        if (user) {
            const token = _createToken(user._id)
            authController.sendMailToConfirm(email, token, 'forgot')
        }
    } catch (err) {
        console.log({ err });
        throw err
    }
}

function _createToken(param) {
    return jwt.sign({ data: param }, process.env.emailSecret, { expiresIn: '1d' });
}


async function getUsers(req, res) {
    try {
        const users = await userService.query(req.query)
        logger.debug(users);
        res.send(users)
    } catch (err) {
        console.log({ err });
        throw err
    }
}


async function getUserIdByToken(req, res) {
    const { token } = req.query
    const data = jwt.verify(token, process.env.emailSecret);
    const id = data.data
    res.json(id)

}

async function deleteUser(req, res) {
    await userService.remove(req.params.id)
    res.end()
}

async function updateUser(req, res) {
    const user = req.body
    if (user.currPass && user.newPass && user.newPassConfirm) {
        try {
            const hashNewPassword = await authService.confirmPassword(user)
            if (!hashNewPassword) return Promise.reject('passwords doesnt matched')
            delete user.currPass
            delete user.newPassConfirm
            delete user.newPass
            req.session.user = JSON.parse(JSON.stringify(user));
            user.password = hashNewPassword

        } catch (err) {
            console.log({ err });
        }
        try {
            const updateUser = await userService.updatePassword(user)
            res.json(updateUser)
        } catch (err) {
            console.log({ err });
        }
    } else {
        req.session.user = JSON.parse(JSON.stringify(user));
        delete req.session.user.newPass
        try {
            console.log('lart try', { user });
            await userService.update(user)
            res.send(user)
        } catch (err) {
            console.log({ err });
        }
    }
}


async function savePassword(req, res) {
    const { id, newPass, confirmNewPass } = req.body
    if (newPass !== confirmNewPass) res.json('passwords not match')
    const u = await getById(id)
    if (u) {
        const hash = await bcrypt.hash(newPass, 10)
        u.password = hash
        await userService.updatePassword(u)
    }
}

async function confirmEmail(req, res) {
    const { token, type } = req.params
    const data = jwt.verify(token, process.env.emailSecret);
    const id = data.data

    if (type === 'confirm') {
        await userService.confirmEmail(id)
    } else {
        await userService.resetPassword(id)
    }
    res.json(id)
}

async function sendMailToOwner(req, res) {
    const { userId, orderId } = req.query
    const user = await userService.getById(userId)

    const order = user.orders.find(o => o.id === orderId)
    console.log({ orderId, user, order });
    // Step 1
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email, // TODO: your gmail account
            pass: process.env.pass  // TODO: your gmail password
        }
    });
    // Step 2
    let mailOptions = {
        from: process.env.email, // TODO: email sender
        to: process.env.email, // TODO: email receiver
        subject: 'order',
        attachments: [{
            filename: 'logo.png',
            path: 'logo.png',
            cid: 'logo'
        }],
        html: _renderMsg(user, order)
    };
    // Step 3
    console.log({ mailOptions, transporter });
    transporter.sendMail(mailOptions, (err, data) => {
        if (err) {
            return console.log('Error occurs', { err });
        }
        return console.log('Email sent!!!');
    });
}

function _renderMsg(user, order) {

    const date = new Date(order.createdAt).toLocaleDateString('en-GB')
    var str = `
       <div style="direction:rtl">
          <h1>פרטי המשתמש: </h1>
          <h3> שם: ${user.fname} ${user.lname} </h3>
          <h3> מס' טלפון: ${order.phoneNumber}  </h3>
          <h3>  כתובת:   ${order.address} </h3>
      </div>
       <div>    
         <h2>    פרטי הזמנה : </h2>
         <h3>   מספר הזמנה :${order.id} </h3>
         <h3>     נוצרה בתאריך: ${date} </h3>
         <h3>    המוצרים: </h3>
<div style="display:flex">
         ,
      `
    str += order.items.map(item => {
        return `
        <div style="margin-right:35px">
          <h4 > שם: ${item.name}<h4/>
          <h4>  צבע: ${item.color}<h4/>
          <h4> מידה: ${item.size}<h4/>
          <h4>  מחיר: ${item.price}<h4/>
          <a href="https://xl-shop.herokuapp.com/#/item/${item._id}">  הקלק כאן לצפייה במוצר   </a>
          </div>
    `
    })
    str += `   </div>     </div> 
      <h3 style="color:green;">  מחיר כולל:${order.totalPrice}</h3>
      <img style="background-color:#2d383a;width:100px;height:90px;" src="cid:logo">
      </div>
      `
    return str
}

async function sendMails(req, res) {
    const { title, text } = req.query
    const users = await userService.query()
    const usersAgreeToEmailSends = users.filter(user => user.emailSends)
    const emails = usersAgreeToEmailSends.map(user => user.email)
    console.log(title, text);
    // Step 1
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.email, // TODO: your gmail account
            pass: process.env.pass  // TODO: your gmail password
        }
    });
    // Step 2
    let mailOptions = {
        from: process.env.email, // TODO: email sender
        to: emails, // TODO: email receiver
        subject: title,
        html: `<div>
        <p style="text-align:center;font-size:25px">  ${text}  </p>
              <div style="text-align:center;">
              <img style="background-color:#2d383a;width:100px;height:90px;" src="cid:logo"> 
             </div>
        </div>`,
        attachments: [{
            filename: 'logo.png',
            path: 'logo.png',
            cid: 'logo'
        }],
    };
    // Step 3
    transporter.sendMail(mailOptions, (err, data) => {
        console.log(mailOptions.from)
        console.log(mailOptions.html);
        console.log(mailOptions.to);
        if (err) {
            return console.log('Error occurs', { err });
        }
        return console.log('Email sent!!!');
    });
}

module.exports = {
    getUser,
    getUsers,
    deleteUser,
    updateUser,
    confirmEmail,
    sendMailToOwner,
    savePassword,
    sendMails,
    getUserIdByToken,
    forgotPassword

}