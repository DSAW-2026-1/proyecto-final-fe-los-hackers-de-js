const express = require('express')
const router = express.Router()
const db = require("../../dbManager")

// GET /api/notifications?page=X
router.get('/', async (req, res) => {
    const {since} = req.query || null
    const pageQuery = parseInt(req.query.page) || 1
    const page = Math.max(1, pageQuery)
    const limit = 12

    const UID = req.token && req.token.payload && req.token.payload.UID
    if (!UID) return res.status(400).json({error: "Invalid JWT token"})

    // Ensure user exists (return 404 if not)
    const user = await db.findUserByUID(UID)
    if (!user) return res.status(404).json({error: "User not found"})

    // Parse optional `since` query param
    let sinceDate = null
    if (since) {
        const parsed = new Date(since)
        if (isNaN(parsed.getTime())) return res.status(400).json({ error: "Invalid 'since' date" })
        sinceDate = parsed
    }

    const zeroBasedPage = page - 1
    const data = await db.findNotificationsByUser(UID, zeroBasedPage, limit, sinceDate)
    if (data === null) return res.status(500).json({ error: "Server error" })

    const { result, count } = data

    //Select err message depending on whether new notifications or all notifications were queried
    if((!count || count === 0)){
        if(sinceDate)  return res.status(204).json({ message: "No new notifications" })
        else return res.status(204).json({ message: "No notifications" })
    }

    const pages = Math.max(1, Math.ceil(count / limit))
    if (page > pages) return res.status(400).json({ error: "Result page out of range" })

    const resultsObj = {}
    for (let i = 0; i < result.length; i++) {
        const n = result[i]
        resultsObj[i] = {
            notificationID: n._id ? n._id.toString() : null,
            type: n.type || null,
            title: n.title || null,
            message: n.message || null,
            createdAt: n.createdAt || null,
            read: !!n.read,
            topicID: n.topicID || null
        }
    }

    return res.status(200).json({ count, pages, page, results: resultsObj })
})

module.exports = router
