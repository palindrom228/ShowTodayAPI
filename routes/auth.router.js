const {Router} = require('express')
const User = require('../models/User')
const LeadsToCity = require('../models/LeadsToCity')
const GamesToCity = require('../models/GamesToCity')
const City = require('../models/City')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const mongoose = require('mongoose')
const config = require('config')
const authMiddleware = require('../middleware/auth.middleware')
const { findById } = require('../models/User')
const Room = require('../models/Room')
const router = Router()

router.post('/login', async (req, res) => {
    try {
        const {email, password, isReactNative} = req.body
        const candidate = await User.findOne({email: email})
        if (!candidate){
            return res.status(404).json({
                message: 'Данный пользователь не найден'
            })
        }
        const isMatch = await bcrypt.compare(password, candidate.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Неверный пароль' })
        }
        const token = jwt.sign(
            { userId: candidate._id ,
            cityId: candidate.cityId
            },
            config.get('jwtSecret'),
            { expiresIn: isReactNative? '7d':'12h' }
        )
        const studios = await GamesToCity.find({owner: candidate.cityId})
        return res.status(200).json({ token, type: candidate.type, city: candidate.city, name: candidate.name, studios})
    } catch (error) {
        console.log(error)
        return res.status(200).json({message: 'что-то пошло не так'})
    }
})
router.post('/createcity',
[check('password', 'Минимальная длина пароля 7 символов').isLength({min: 7}),
check('city', 'Минимальная длина города 2 символа').isLength({min: 2}),]
, async(req,res)=>{
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()){

            return res.status(400).json({
                errors: errors.array(),
                message: "Неккоректные данные при регистрации"
            })
        }
        const {email, password, type, city,name, nameOfCity} = req.body
        const candidate = await User.findOne({email})
        if (candidate) {
            return (res.status(400).json({
                message: 'Данный email уже занят'
            }))
        }
        const hashedPassword = await bcrypt.hash(password, 12)
        const user = new User({email: email, password: hashedPassword, type: type, city: city, name: name})
        await user.save()
        if(type == 2){
            const check = await City.findOne({city: city})
            if(check){
                await User.findByIdAndDelete(user._id)
                return (res.status(400).json({
                    message: 'Данный город уже создан'
                }))
            }
            const newcity = new City({
                city: city,
                admins: [user._id],
                owner: user._id
            })
            await newcity.save()   
            const games = new GamesToCity({owner: newcity._id, version: 0, name: nameOfCity, type: 'main'})
            const leads = new LeadsToCity({owner: newcity._id})
            const rooms = new Room({owner: newcity._id})
            await rooms.save()
            await games.save()
            await leads.save()
            await User.findOneAndUpdate({_id: user._id}, {$set: {cityId: newcity._id}})
            await City.findByIdAndUpdate(newcity._id, {studios: [games._id]})
            return res.status(201).json({message: 'Пользователь создан'})
        }
        return res.status(201).json({message: 'Пользователь создан'})
        
    } catch (e) {
        console.log(e)
        
        return res.status(400).json({message: 'Что то произошло'})
    }
})
router.post('/reconnect', authMiddleware, async(req,res)=>{
    try {
        const user = req.user.userId
        const data = await User.findById(user)
        let isReactNative = false
        if(req.body.hasOwnProperty('isReactNative')){
            isReactNative = true
        }
        const token = jwt.sign(
            { userId: data._id ,
            cityId: data.cityId
            },
            config.get('jwtSecret'),
            { expiresIn: isReactNative? '7d':'12h' }
        )
        const studios = await GamesToCity.find({owner: data.cityId})
        return res.status(200).json({ token: token, type: data.type, city: data.city, name: data.name, studios })
    } catch (error) {
        console.log(error)
        return res.status(400).json({message:'Что-то пошло не так'})
    }
})
module.exports = router