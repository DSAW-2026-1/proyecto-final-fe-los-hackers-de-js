const express = require('express');
const router = express.Router();
const db = require("../../dbManager");
const VALID_CAREERS = (process.env.VALID_CAREERS)? process.env.VALID_CAREERS.split(',') : [
    'Ingeniería Informática', 'Ingeniería Industrial', 'Ingeniería Civil', 'Ingeniería Mecánica', 'Ingeniería Química', 'Medicina', 'Enfermería', 'Fisioterapia', 'Comunicación Social', 'Comunicación Audiovisual', 'Periodismo', 'Derecho', 'Ciencias Políticas', 'Administración de Empresas', 'Economía', 'Negocios Internacionales', 'Administración de Instituciones de Servicio'
] //sample careers idk if they all actually exist
router.patch('/', async function (req, res) {
    const UID = req.token.payload.UID
    const user = await db.findUserByUID(UID)
    if (!user) return res.status(404).json({error: 'User not found'})
    if(user.isSuspended) return res.status(404).json({error: 'User not found'})

    let {username, career, photo} = req.body || {};

    if (username === "") username = null
    if (career === "") career = null
    if (photo === "") photo = null

    const errorMsg = "Malformed request"

    if (!username && !career && !photo) return res.status(400).json({error: errorMsg});

    if(username){
        //Enforce alphanumeric users
        if (!/^[a-zA-Z0-9]+$/.test(username)) return res.status(400).json({error: errorMsg});

        //Check that our new username isn't the same as someone else
        try {
            const existingUser = await db.findUser({username: username})
            if (existingUser) {
                if(existingUser._id.toString() === UID) return res.status(400).json({error: "You cannot change your username to the same username"})
                else return res.status(409).json({error: "Username is already in use"})
            }
        }
        catch(e){
            console.error(e)
            return res.status(500).json("Failed to query internal database")
        }
    }
    if(career && !VALID_CAREERS.includes(career)) return res.status(400).json({error: errorMsg});

    //TODO: Validate image as valid base64 image file. Is this even possible without actually creating the image somewhere in the server?
    
    let newData = {}
    if (username) newData["username"] = username
    if (career) newData["career"] = career
    if (photo) newData["photo"] = photo

    let success = await db.updateUser(UID, newData)
    if(success) return res.json( { body: "User updated" })
    else return res.status(500).json({error: 'Failed to update user'})
});

module.exports = router;
