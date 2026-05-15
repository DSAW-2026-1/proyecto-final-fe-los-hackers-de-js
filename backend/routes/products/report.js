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

// POST /api/products/:productID/report
router.post('/:productID/report', async function (req, res) {
    console.log(req.body)
    const UID = req.token.payload.UID
    const { productID } = req.params
    const { category, reportTitle, reportBody } = req.body || {}

    // Basic validation
    if (!productID) return res.status(400).json({ error: 'Incomplete or malformed request' })
    if (typeof category !== 'string' || typeof reportTitle !== 'string' || typeof reportBody !== 'string') {
        return res.status(400).json({ error: 'Incomplete or malformed request' })
    }
    const cat = category.trim()
    const title = reportTitle.trim()
    const body = reportBody.trim()
    if (!cat || !title || !body) return res.status(400).json({ error: 'Incomplete or malformed request' })
    if (!VALID_REPORT_CATEGORIES.includes(cat)) return res.status(400).json({ error: 'Incomplete or malformed request' })

    // Find product
    const product = await db.findProductByID(productID)
    if (!product) return res.status(404).json({ error: 'Product not found' })

    // Find user
    const user = await db.findUserByUID(UID)
    if (!user) return res.status(400).json({ error: 'Incomplete or malformed request' })

    // Prevent duplicate reports
    const existing = await db.findReport({ reporterID: user._id, reportedID: product._id, type: 'productReport' })
    if (existing) return res.status(409).json({ error: 'You have already reported this product' })

    const safeTitle = escapeHtml(title)
    const safeBody = escapeHtml(body)

    const report = {
        reporterID: user._id,
        type: 'productReport',
        reportedID: product._id,
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
