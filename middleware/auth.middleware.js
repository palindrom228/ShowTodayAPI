const jwt = require("jsonwebtoken")
const config = require('config')

module.exports = (req,res,next) => {
    if(req.method === 'OPTIONS'){
        return next()
    }

    try {
        const token = req.headers.authorization.split(' ')[1]
        
        if(!token){
            res.status(401).json({message: 'Ваш API-token истек, пройдите пожалуйста повторную авторизацию, все это сделано с целью, обезопасить ваши данные' , auth: false})
        }
        const decoded = jwt.verify(token, config.get("jwtSecret"))
        req.user = decoded
        next()
    } catch (error) {
        console.log(error)
        res.status(401).json({message: 'Ваш API-token истек, пройдите пожалуйста повторную авторизацию, все это сделано с целью, обезопасить ваши данные',auth: false})
    }
}