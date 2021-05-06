const moment = require('moment')
const {Router} = require('express')
const router = Router()
const authMiddleware = require('../middleware/auth.middleware')
const fs = require('fs')
const multer = require('multer')
const storage = multer.diskStorage({
    
    destination: function (req, file, cb) {
      cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
    const data = moment().format("DD-MM-Y-HH-mm-ss")
      cb(null, `${data}-${file.originalname}`) //Appending .jpg
    }
  })

  
  const upload = multer({ storage: storage });

router.post('/addPhoto',upload.single('image'), authMiddleware, async(req,res)=>{
    try {
        const file = req.file
        console.log(file)
        return res.status(201).json({message: 'ok'})
    } catch (error) {
        console.log(error)
        return res.status(400).json({message:'Что-то пошло не так'})
    }
})
 

  module.exports = router