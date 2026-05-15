const express = require('express')
const router = express.Router()
const db = require('../../dbManager')

// PATCH /api/notifications/readAll
router.patch('/', async (req, res) => {
    const UID = req.token && req.token.payload && req.token.payload.UID
    if (!UID) return res.status(400).json({ error: "User not found" })

    // Ensure user exists
    const user = await db.findUserByUID(UID)
    if (!user) return res.status(404).json({ error: "User not found" })

    // Check whether user has any notifications at all
    const existing = await db.findNotificationsByUser(UID, 0, 1)
    if (!existing) return res.status(500).json({ error: "Server error" })
    if (!existing.count || existing.count === 0) return res.status(404).json({ message: "No notifications" })

    const modified = await db.markAllNotificationsRead(UID)
    if (modified === false) return res.status(500).json({ error: "Server error" })

    return res.status(200).json({ message: "Notifications marked as read" })
})

module.exports = router
