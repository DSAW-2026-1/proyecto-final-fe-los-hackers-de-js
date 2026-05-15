const express = require('express')
const router = express.Router()
const db = require('../../dbManager')

// GET /api/notifications/unreadCount
router.get('/', async (req, res) => {
    const UID = req.token && req.token.payload && req.token.payload.UID
    if (!UID) return res.status(404).json({ error: "User not found" })

    // Ensure user exists
    const user = await db.findUserByUID(UID)
    if (!user) return res.status(404).json({ error: "User not found" })

    const count = await db.countUnreadNotifications(UID)
    if (count === null) return res.status(500).json({ error: "Server error" })

    return res.status(200).json({ count })
})

module.exports = router
