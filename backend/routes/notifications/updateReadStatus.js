const express = require('express')
const router = express.Router()
const db = require("../../dbManager")

// PATCH /api/notifications/:notificationID
router.patch('/:notificationID', async (req, res) => {
    const UID = req.token && req.token.payload && req.token.payload.UID
    if (!UID) return res.status(400).json({ error: "Invalid JWT token" })

    const notificationID = req.params.notificationID
    if (!notificationID) return res.status(400).json({ error: "Notification not found" })

    const notification = await db.findNotificationByID(notificationID)
    if (!notification) return res.status(404).json({ error: "Notification not found" })

    if (notification.userID !== UID) return res.status(403).json({ error: "You are not allowed to do this" })

    if (typeof req.body.read !== 'boolean') return res.status(400).json({ error: "Invalid 'read' value" })

    const success = await db.updateNotification(notificationID, { read: req.body.read })
    if (!success) return res.status(500).json({ error: "Server error" })

    return res.status(200).json({ message: "Notification state updated" })
})

module.exports = router
