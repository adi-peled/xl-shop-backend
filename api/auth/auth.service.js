const bcrypt = require("bcryptjs")
const userService = require('../user/user.service')
const logger = require('../../services/logger.service')
const saltRounds = 10

async function login(email, password) {

    if (!email || !password) return Promise.reject('email and password are required!')
    const user = await userService.getByEmail(email)
    if (!user) return Promise.reject('Invalid email or password')
    const match = await bcrypt.compare(password, user.password)
    if (!match) return 'Invalid email or password';
    if (!user.activeMail) return 'need active mail before login';
    // return Promise.reject('need active  mail before login')
    delete user.password
    return user
}

async function confirmPassword({ currPass, newPass, newPassConfirm, _id }) {

    console.log({ currPass, newPass, newPassConfirm, _id });
    const user = await userService.getById(_id)
    if (!user) return Promise.reject('Invalid ')
    const match = await bcrypt.compare(currPass, user.password)
    if (!match) return Promise.reject('password is wrong')

    if (newPass === newPassConfirm) {
        return await bcrypt.hash(newPass, saltRounds)
    }
}


async function signup(email, password, fname, lname, emailSends) {
    logger.debug(`auth.service - signup with email: ${email}`)
    if (!email || !password) return Promise.reject('email and password are required!')
    const hash = await bcrypt.hash(password, saltRounds)
    return await userService.add({ email, password: hash, fname, lname, emailSends })
}










module.exports = {
    signup,
    login,
    confirmPassword
}