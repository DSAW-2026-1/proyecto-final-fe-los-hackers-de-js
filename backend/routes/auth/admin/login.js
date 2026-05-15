const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require("../../../dbManager")
const bcrypt = require('bcrypt')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
router.post('/', async (req, res) => {
    const {username, password} = req.body || {};
    if (!username || !password) return res.status(400).json({error: 'Invalid credentials'});

    const admin = await db.findAdmin({username: username})

    //If user doesn't exist as admin, check if it exists as user for the error msg
    if (!admin) {
        const user = await db.findUser({username: username})
        if(user){
            bcrypt.compare(password, user.password, function(err, result) {
                if(result === true){
                    return res.status(403).json({error: 'User credentials are not acceptable for admin login'})
                }
                else return res.status(400).json({error: 'Invalid credentials'})
            });
        }
        else return res.status(400).json({error: 'Invalid credentials'})
    }
    else{
        bcrypt.compare(password, admin.password, function(err, result) {
            if(result === true){
                const payload = {UID: admin._id, role: admin.role, permissions: admin.permissions};
                const token = jwt.sign(payload, JWT_SECRET, {expiresIn: '1h'});

                res.json({token});
            }
            else return res.status(400).json({error: 'Invalid credentials'})
        })
    }
});

module.exports = router;