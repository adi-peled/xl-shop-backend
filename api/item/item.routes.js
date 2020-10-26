const express = require('express')
const { requireAuth, requireAdmin } = require('../../middlewares/requireAuth.middleware')
const { getItem, getItems, deleteItem, updateItem, addItem } = require('./item.controller')
const router = express.Router()

router.get('/', getItems);
router.get('/:id', getItem);
router.post('/', requireAuth, requireAdmin, addItem);
router.put('/:id', requireAuth, requireAdmin, updateItem)
router.delete('/:id', requireAuth, requireAdmin, deleteItem)

module.exports = router