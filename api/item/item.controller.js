const itemService = require('./item.service')
const logger = require('../../services/logger.service')

async function getItem(req, res) {
    const item = await itemService.getById(req.params.id)
    res.json(item)
}


async function getItems(req, res) {
    try {
        const items = await itemService.query(req.query)
        res.send(items)
    } catch (err) {
        throw err;
    }
}

async function deleteItem(req, res) {
    try {
        await itemService.remove(req.params.id)
        res.end()
    } catch (err) {
        console.log('f', { err });
        throw err
    }

}

async function updateItem(req, res) {
    const item = req.body;
    try {
        await itemService.update(item)
        res.json(item)
    } catch (err) {
        console.log({ err });
        throw err
    }
}

async function addItem(req, res) {
    const item = req.body;
    try {
        await itemService.add(item)
        res.json(item)
    } catch (err) {
        console.log({ err });
        throw err

    }
}


module.exports = {
    getItem,
    getItems,
    deleteItem,
    updateItem,
    addItem,
}