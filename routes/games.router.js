const {Router} = require('express')
const User = require('../models/User')
const Leads = require('../models/Leads')
const Games = require('../models/Games')
const City = require('../models/City')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {check, validationResult} = require('express-validator')
const mongoose = require('mongoose')
const config = require('config')
const authMiddleware = require('../middleware/auth.middleware')
const Lead = require('../models/Lead')
const router = Router()
const moment = require('moment')
const Game = require('../models/Game')
const { findOne } = require('../models/Games')

function init(io){
router.post('/getclient',authMiddleware,async(req,res)=>{
    try {
        const phoneFind = req.body.phone
        const reg = new RegExp(phoneFind)
        const candidates = await Leads.aggregate(
            [{$match: {owner: req.user.cityId}},
            {$unwind: '$leads'},
            {$match: {
                $or: [
                    {'leads.phone': reg}
                ]
            }}]
        )
    if (!candidates){
        return res.status(404).json({message: "Нет таких"})
    }
    const arr = []
    candidates.map((lead)=>{
        arr.push(lead.leads)
    })
    return res.status(200).json(arr)
    } catch (error) {
        console.log(error)
        return res.status(401).json({message: 'SM'})
    }
})
router.post('/createclient',[check('phone', 'Минимальная длина телефона 11 символов').isLength({min: 11}),
check('clientName', 'Минимальная длина имени 2 символа').isLength({min: 2}),], authMiddleware, async(req,res)=>{
    
    try {
        const errors = validationResult(req)
        if (!errors.isEmpty()){
            console.log(errors)
            return res.status(400).json({
                
                errors: errors.array(),
                message: "Неккоректные данные при создании клиента"
            })
        }
        const {clientName, phone,date} = req.body
    const candidate = await Leads.aggregate(
        [{$match: {owner: req.user.cityId}},
        {$unwind: '$leads'},
        {$match: {'leads.phone': phone}}]
    )
    if(candidate.length > 0){
        return res.status(404).json({message: "Данный лид уже создан"})
    }
    const lead = await new Lead({phone, name: clientName, date})
    await Leads.updateOne({owner: req.user.cityId}, {$push: {leads: lead}})
    return res.status(201).json(lead)
    } catch (error) {
        console.log(error)
        return res.status(501).json({message: 'Что то пошло не так'})
    }
})
router.post('/creategame', authMiddleware, async(req,res)=>{
    try {
        const {date, duration, type, address, col, summ, prepay, evening, client, age} = req.body
        if(type === 2 && addres === ''){
            return res.status(400).json({
                message: "Если игра выездная то должен присутствовать Адрес"
            })
        }
        if(type === 2){
            if ( !(addres.search(/\d/) != -1 )){
                return res.status(400).json({
                    message: "В адресе нет номера дома"
                })
            }
        }
        if(!moment(moment(date).format('D/M/Y HH:mm'), 'D/M/Y HH:mm', true).isValid()){
            return res.status(400).json({
                message: "Неккоректная дата, попробуйте еще раз"
            })
        }
        const workers = {
            tamada: '',
            sound: '',
            balls: ''
        }
        if(summ<=0) {
            return res.status(400).json({
                message: "Неккоректная сумма, попробуйте еще раз"
            })
        }
        if(client===''){
            return res.status(400).json({
                message: "Выберите пожалуйста клиента и попробуйте еще раз"
            })
        }
        const version = await Games.aggregate([
            {$match: {owner: req.user.cityId}},
            {$project: {'version': '$version'}}
        ]
        )
        console.log(version)
        const game = await new Game({lead: client, date: date, dateOfCreation: moment().valueOf(), col, summ, prepay, evening, duration,workers, type, address: address,age,version: version[0].version + 1 })
        await Games.updateOne({owner: req.user.cityId}, {$push: {games: {
            $each: [game],
            $sort: { date: 1} 
        }}, $inc: {version: 1} 
    }
        );
        return res.status(201).json(game._id)
        
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
router.post('/loadgames', authMiddleware, async(req,res)=>{
    try {
        const month = req.body.month
        const min = moment(month).subtract(1,'week').valueOf()
        const max = moment(month).add(1,'M').add(1,'W').valueOf()
        const {cityId} = req.user
        const games = await Games.aggregate(
            [{$match: {owner: cityId}},
            {$unwind: '$games'},
            {$match: {
                $or: [
                    {'games.date': {$lte: max, $gte: min}}
                ]
            }}]
        )
        const arr = []
        games.map((game)=>{
        arr.push(game.games)
        })
        return res.status(200).json(arr)
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
router.post('/getClientForGame', authMiddleware, async(req,res)=>{
    try {
        const {clientId} = req.body
        const {cityId} = req.user
        const client = await Leads.aggregate([
            {$match: {owner: cityId}},
            {$unwind: '$leads'},
            {$match: 
                {'leads._id': mongoose.Types.ObjectId(clientId)}
            }
        ])
        
        return res.status(200).json(client[0].leads)
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
router.post('/getGame', authMiddleware, async(req, res)=>{
    try {
        const {id} = req.body
        const {cityId} = req.user
        const game = await Games.aggregate([
            {$match: {owner: cityId}},
            {$unwind: '$games'},
            {$match: 
                {'games._id': mongoose.Types.ObjectId(id)}
            }
        ])
        return res.status(200).json(game[0].games)
    } catch (error) {
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
return router
}

module.exports = init