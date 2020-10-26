const dbService = require('../../services/db.service')
const ObjectId = require('mongodb').ObjectId
module.exports = {
    query,
    getById,
    getByEmail,
    remove,
    update,
    add,
    updatePassword,
    confirmEmail,
    resetPassword
}


async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)

    const collection = await dbService.getCollection('user')
    try {
        const users = await collection.find(criteria).toArray();

        return users
    } catch (err) {
        throw err;
    }
}


function _buildCriteria(filterBy) {
    const criteria = {};
    if (filterBy.name) {
        var filterName = new RegExp(filterBy.name, 'i')
        criteria.fullName = { $regex: filterName }
    }
    return criteria;
}

async function getById(userId) {
    const collection = await dbService.getCollection('user')
    try {
        const user = await collection.findOne({ "_id": ObjectId(userId) })
        return user
    } catch (err) {
        console.log(`ERROR: while finding user ${userId}`)
        throw err;
    }
}
async function getByEmail(email) {
    const collection = await dbService.getCollection('user')
    try {
        const user = await collection.findOne({ email })
        return user
    } catch (err) {
        console.log(`ERROR: while finding user ${email}`)
        throw err;
    }
}

async function remove(userId) {
    const collection = await dbService.getCollection('user')
    try {
        await collection.deleteOne({ "_id": ObjectId(userId) })
    } catch (err) {
        console.log(`ERROR: cannot remove user ${userId}`)
        throw err;
    }
}

async function update(user) {
    console.log({ user });
    const oldUser = await getById(user._id)
    if (!oldUser) return Promise.reject('update baababa')
    user.password = oldUser.password
    const collection = await dbService.getCollection('user')
    const userId = user._id
    delete user._id
    try {
        await collection.replaceOne({ "_id": ObjectId(userId) }, user)
        delete oldUser.password
        delete user.password
        user._id = userId
        return user
    } catch (err) {
        console.log(`ERROR: cannot update user ${user._id}`)
        throw err;
    }
}


async function updatePassword(user) {
    const collection = await dbService.getCollection('user')
    const userId = user._id
    delete user._id
    try {
        await collection.replaceOne({ "_id": ObjectId(userId) }, user)
        delete user.password
        console.log({ user });
        return user
    } catch (err) {
        console.log(`ERROR: cannot update user ${user._id}`)
        throw err;
    }
}

async function add(user) {
    const collection = await dbService.getCollection('user')
    const users = await query()
    const idx = users.findIndex(u => u.email === user.email)
    console.log({ idx });
    if (idx !== -1) return null
    console.log('insert');
    user.activeMail = false
    user.isAdmin = false
    user.createdAt = Date.now()
    user.favs = []
    user.cart = []
    user.orders = []
    try {
        await collection.insertOne(user);
        return user;
    } catch (err) {
        console.log(`ERROR: cannot insert user`)
        throw err;
    }
}


async function confirmEmail(id) {
    const user = await getById(id)
    if (user) {
        user.activeMail = true
        delete user.password
        await update(user)
    }
}



async function resetPassword(id) {
    const user = await getById(id)
    if (user) {
        return true
    }
}