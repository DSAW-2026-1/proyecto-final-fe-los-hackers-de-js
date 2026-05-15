const express = require('express')
const router = express.Router({ mergeParams: true })
const db = require('../../dbManager')

const VALID_REPORT_CATEGORIES = [
    "fake",
    "spam",
    "scam",
    "inappropriate",
    "prohibited",
    "other"
]

function escapeHtml(str){
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
}

// POST /api/users/:UID/report
router.post('/:UID/report', async function (req, res) {
    const reporterUID = req.token && req.token.payload && req.token.payload.UID
    const { UID } = req.params
    const { category, reportTitle, reportBody } = req.body || {}

    // Basic validation
    if (!UID) return res.status(400).json({ error: 'Incomplete or malformed request' })
    if (typeof category !== 'string' || typeof reportTitle !== 'string' || typeof reportBody !== 'string') {
        return res.status(400).json({ error: 'Incomplete or malformed request' })
    }
    const cat = category.trim()
    const title = reportTitle.trim()
    const body = reportBody.trim()
    if (!cat || !title || !body) return res.status(400).json({ error: 'Incomplete or malformed request' })
    if (!VALID_REPORT_CATEGORIES.includes(cat)) return res.status(400).json({ error: 'Incomplete or malformed request' })

    // Find reported user
    const reportedUser = await db.findUserByUID(UID)
    if (!reportedUser) return res.status(404).json({ error: 'User not found' })

    // Find reporter user
    const reporterUser = await db.findUserByUID(reporterUID)
    if (!reporterUser) return res.status(400).json({ error: 'Incomplete or malformed request' })

    // Prevent duplicate reports
    const existing = await db.findReport({ reporterID: reporterUser._id, reportedID: reportedUser._id, type: 'userReport' })
    if (existing) return res.status(409).json({ error: 'You have already reported this user' })

    const safeTitle = escapeHtml(title)
    const safeBody = escapeHtml(body)

    const report = {
        reporterID: reporterUser._id,
        type: 'userReport',
        reportedID: reportedUser._id,
        category: cat,
        reportTitle: safeTitle,
        reportBody: safeBody,
        createdAt: new Date()
    }

    const insertedId = await db.addReport(report)
    if (!insertedId) return res.status(500).json({ error: 'Internal server error' })

    return res.status(201).json({ message: 'Report created' })
})

module.exports = router
