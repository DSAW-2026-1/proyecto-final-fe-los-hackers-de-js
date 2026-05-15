// Taken and adapted from https://www.w3tutorials.net/blog/catch-error-for-bad-json-format-thrown-by-express-json-middleware/

// CUSTOM ERROR HANDLER FOR INVALID JSON
module.exports = ((err, req, res, next) => {
    // Check if the error is a JSON parsing error from express.json()
    if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid JSON payload received',
            error: {
                type: err.name, // "SyntaxError"
                detail: err.message, // e.g., "Unexpected end of JSON input"
                // Optional: Add more context (e.g., request ID, timestamp)
                timestamp: new Date().toISOString()
            }
        });
    }

    // Pass non-JSON parsing errors to Express's default error handler
    next(err);
});