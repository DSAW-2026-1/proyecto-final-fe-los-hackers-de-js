const express = require('express')
const router = express.Router()
const db = require('../../dbManager')
const ITEMS_PER_PAGE = 12

// PATCH /api/admin/users/:UID/suspend
router.patch('/:UID/suspend', async function (req, res) {
    const { UID } = req.params
    const { reason } = req.body || {}

    if (!UID) return res.status(400).json({ error: 'UID not found' })
    const user = await db.findUserByUID(UID)
    if (!user) return res.status(400).json({ error: 'UID not found' })
    if (user.isSuspended) return res.status(409).json({ error: 'User is already suspended' })
    const suspended = await db.suspendUser(UID, reason)
    if(suspended) return res.json({ message: 'User suspended successfully' })
    else{
        console.error('Error suspending user '+UID)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

// GET /api/admin/users?page=X&query=... (includes suspended users)
// Allows queries and filtering by whether the user is a seller (mostly unused as the frontend doesn't send any filters, could be used at some point in the future)
router.get('/', async function (req, res) {
    let { page, query, isSeller } = req.query
    if(!page) page = 1
    let pageInt = parseInt(page) || 1
    if(isNaN(pageInt)) pageInt = 1

    const fullQuery = {}
    if (query) {
        fullQuery['$or'] = [ { name: { $regex: query } }, { email: { $regex: query } } ]
    }
    if (typeof isSeller !== 'undefined') {
        const s = String(isSeller).toLowerCase()
        const truthy = ['true', '1', 'yes', 'y']
        const falsy = ['false', '0', 'no', 'n']
        if (truthy.includes(s)) fullQuery['isSeller'] = true
        else if (falsy.includes(s)) fullQuery['isSeller'] = false
        else return res.status(400).json({ error: 'Invalid isSeller value' })
    }

    const search = await db.findUsers(fullQuery, (pageInt-1), ITEMS_PER_PAGE)
    if (!search || !search.result) return res.status(500).json({ error: 'Internal server error' })
    const users = search.result
    if (users.length === 0) {
        if (search.count === 0) return res.status(404).json({ error: 'No users found.' })
        else return res.status(400).json({ error: 'Result page out of range.' })
    }

    const returnUsers = users.map(u => ({
        UID: u._id,
        username: u.username,
        email: u.email,
        career : u.career || null,
        isSuspended: !!u.isSuspended,
        isSeller: !!u.isSeller,
        photo: u.photo || null,
        sales: u.sales || 0,
        reviews: u.reviews || 0,
        reputation: u.reputation || null
    }))

    return res.json({
        count: search.count,
        pages: Math.ceil(search.count/ITEMS_PER_PAGE),
        page: pageInt,
        results: Object.assign({}, returnUsers)
    })
})

module.exports = router

