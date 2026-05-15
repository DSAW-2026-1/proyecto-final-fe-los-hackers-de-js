const express = require('express')
const router = express.Router()
const db = require('../../dbManager')

// GET /api/admin/reports?page=X  (paginated list of active reports)
router.get('/', async function (req, res) {
    const pageQuery = Number(req.query.page) || 1
    const page = Math.max(1, Math.floor(pageQuery))
    const limit = 12

    const data = await db.findActiveReports(page - 1, limit)
    if (!data) return res.status(500).json({ error: 'Internal server error' })
    const { result, count } = data
    if (count === 0 || !result || result.length === 0) return res.status(204).json({ message: 'No reports found' })

    const pages = Math.max(1, Math.ceil(count / limit))
    if (page > pages) return res.status(400).json({ error: 'Result page out of range' })

    const resultsObj = {}
    result.forEach((r, idx) => {
        resultsObj[idx] = {
            reportID: r._id,
            reporterID: r.reporterID,
            type: r.type,
            reportedID: r.reportedID,
            category: r.category,
            reportTitle: r.reportTitle,
            reportBody: r.reportBody,
            createdAt: r.createdAt || null
        }
    })

    return res.status(200).json({
        count,
        pages,
        page,
        results: resultsObj
    })
})

// GET /api/admin/reports/:reportID
router.get('/:reportID', async function (req, res) {
    const { reportID } = req.params
    if (!reportID) return res.status(400).json({ error: 'Report ID required' })

    const report = await db.findReportByID(reportID)
    if (!report) return res.status(404).json({ error: 'Report not found' })

    return res.status(200).json({
        reportID: report._id,
        reporterID: report.reporterID,
        type: report.type,
        reportedID: report.reportedID,
        category: report.category,
        reportTitle: report.reportTitle,
        reportBody: report.reportBody,
        createdAt: report.createdAt || null
    })
})

// PATCH /api/admin/reports/:reportID/resolve
router.patch('/:reportID/resolve', async function (req, res) {
    const { reportID } = req.params
    const { solution, reason } = req.body || {}
    const adminUID = req.token && req.token.payload && req.token.payload.UID

    if (!reportID) return res.status(400).json({ error: 'Report ID required' })
    if (typeof solution !== 'string' || typeof reason !== 'string') return res.status(400).json({ error: 'Invalid payload' })

    const allowed = ['deleteOffending', 'rejectReport']
    if (!allowed.includes(solution)) return res.status(400).json({ error: 'Invalid solution' })

    const report = await db.findReportByID(reportID)
    if (!report) return res.status(404).json({ error: 'Report not found' })

    try {
        // Perform requested corrective action
        if (solution === 'deleteOffending') {
            // For user reports -> suspend user; for product reports -> soft-delete product
            if (report.type === 'userReport') {
                const userID = report.reportedID
                if (!userID) return res.status(400).json({ error: 'Unable to determine user to suspend' })

                const user = await db.findUserByUID(userID.toString ? userID.toString() : userID)
                if (!user) return res.status(404).json({ error: 'User not found' })
                if (user.isSuspended) {
                    await db.updateReport(reportID, { resolved: true, deleted: true, resolutionReason: reason, actionTaken: solution, resolvedAt: new Date(), resolvedBy: adminUID })
                    return res.status(409).json({ error: 'User is already suspended. Report discarded' })
                }

                const suspended = await db.suspendUser(user._id.toString(), reason)
                if (!suspended) return res.status(500).json({ error: 'Failed to suspend user' })

                await db.updateReport(reportID, { resolved: true, deleted: true, resolutionReason: reason, actionTaken: solution, resolvedAt: new Date(), resolvedBy: adminUID })
                return res.status(200).json({ message: 'User suspended. Report solved' })
            }

            if (report.type === 'productReport') {
                const product = await db.findProductRawByID(report.reportedID)
                if (!product) return res.status(404).json({ error: 'Product not found' })
                if (product.deleted) {
                    await db.updateReport(reportID, { resolved: true, deleted: true, resolutionReason: reason, actionTaken: solution, resolvedAt: new Date(), resolvedBy: adminUID })
                    return res.status(409).json({ error: 'Product is already deleted. Report discarded' })
                }

                await db.softDeleteProduct(product._id.toString())
                await db.updateReport(reportID, { resolved: true, deleted: true, resolutionReason: reason, actionTaken: solution, resolvedAt: new Date(), resolvedBy: adminUID })
                return res.status(200).json({ message: 'Product deleted. Report solved' })
            }

            return res.status(400).json({ error: 'Unknown report type' })
        }

        if (solution === 'rejectReport') {
            await db.updateReport(reportID, { resolved: true, deleted: true, resolutionReason: reason, actionTaken: solution, resolvedAt: new Date(), resolvedBy: adminUID })
            return res.status(200).json({ message: 'Report discarded' })
        }

        return res.status(400).json({ error: 'Unhandled solution' })
    }
    catch (e) {
        console.error('Error resolving report', e)
        return res.status(500).json({ error: 'Internal server error' })
    }
})

module.exports = router
