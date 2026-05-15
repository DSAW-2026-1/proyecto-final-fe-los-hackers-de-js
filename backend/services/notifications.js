const db = require('../dbManager')

/**
 * createNotification(notificationData)
 * - notificationData: { userID, type, title?, message?, topicID }
 * Validates and fills defaults, then inserts into DB using dbManager.addNotification
 * Returns insertedId on success, or null on failure
 */
async function createNotification(notificationData) {
    if (!notificationData || !notificationData.userID || !notificationData.type || (!notificationData.message && !notificationData.title) || !notificationData.topicID) return null
    try {
        const doc = {
            userID: notificationData.userID,
            type: notificationData.type,
            title: notificationData.title || notificationData.message.substring(0, 10),
            message: notificationData.message || notificationData.title,
            topicID: notificationData.topicID,
            read: false,
            createdAt: new Date()
        }

        return await db.addNotification(doc)
    }
    catch (e){
        return null
    }
}

module.exports = { createNotification }
