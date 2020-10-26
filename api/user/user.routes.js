const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/requireAuth.middleware')
const { getUser, getUsers, deleteUser, updateUser, confirmEmail, forgotPassword, sendMailToOwner, savePassword, getUserIdByToken, sendMails } = require('./user.controller')
const router = express.Router()


router.get('/', getUsers)
router.get('/logged', getUser)
router.get('/token', getUserIdByToken)
router.get('/forgotPassword', forgotPassword)
router.put('/savePassword', savePassword)
router.get('/sendMail', requireAuth, sendMailToOwner)
router.put('/confirmation/:token/:type', confirmEmail)
router.put('/update/:id', requireAuth, updateUser)
router.delete('/:id', requireAuth, requireAdmin, deleteUser)
router.get('/sendMails', requireAuth, requireAdmin, sendMails)


module.exports = router