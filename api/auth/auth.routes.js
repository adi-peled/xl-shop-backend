const express = require('express')
const { requireAuth } = require('../../middlewares/requireAuth.middleware')
const { login, signup, logout, forgotPassword } = require('./auth.controller')

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.get('/forgot/:email', forgotPassword)
router.post('/logout', requireAuth, logout)

module.exports = router