const dbService = require('../../services/db.service')
const ObjectId = require('mongodb').ObjectId

module.exports = {
    query,
    getById,
    remove,
    update,
    add
}

async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    const collection = await dbService.getCollection('item')
    try {
        let items = await collection.find(criteria).toArray();
        if (filterBy.sortByPrice === 'Low-To-High') {
            items.sort((a, b) => a.price - b.price)
        } else if (filterBy.sortByPrice === 'High-To-Low') {
            items.sort((a, b) => b.price - a.price)
        }
        return items
    } catch (err) {
        throw err;
    }
}

function _buildCriteria(filterBy) {
    let criteria = {}
    if (filterBy.minPrice) {
        criteria = ({
            $and: [{ price: { $lte: Number(filterBy.maxPrice) } },
            { price: { $gte: Number(filterBy.minPrice) } }]
        })
    }
    if (filterBy.subcategory) {
        criteria.subcategory = filterBy.subcategory
    }
    if (filterBy.color) {
        const filterColor = new RegExp(filterBy.color, 'i')
        criteria.colors = { $regex: filterColor }
    }

    if (filterBy.category) {
        criteria.category = filterBy.category
    }
    if (filterBy.type) {
        criteria.type = filterBy.type
    }
    if (filterBy.name) {
        const filterName = new RegExp(filterBy.name, 'i');
        criteria.name = { $regex: filterName }
    }
    return criteria;
}


async function getById(itemId) {
    const collection = await dbService.getCollection('item')
    try {
        const item = await collection.findOne({ "_id": ObjectId(itemId) })
        return item
    } catch (err) {
        console.log(`ERROR: while finding item ${itemId}`)
        throw err;
    }
}

async function remove(itemId) {
    const collection = await dbService.getCollection('item')
    try {
        await collection.deleteOne({ "_id": ObjectId(itemId) })
    } catch (err) {
        console.log(`ERROR: cannot remove item ${itemId}`)
        throw err;
    }
}

async function update(item) {
    const collection = await dbService.getCollection('item')
    const itemId = item._id
    delete item._id
    try {
        await collection.replaceOne({ "_id": ObjectId(itemId) }, item)
        // await collection.updateOne({ _id: item._id }, { $set: item }, { upsert: true })
        return item
    } catch (err) {
        console.log(`ERROR: cannot update item ${item._id}`)
        throw err;
    }
}

async function add(item) {
    const collection = await dbService.getCollection('item')
    try {
        await collection.insertOne(item);
        return item;
    } catch (err) {
        console.log(`ERROR: cannot insert item`)
        throw err;
    }
}




