const {Router} = require('express')
const User = require('../models/User')
const LeadsToCity = require('../models/LeadsToCity')
const GamesToCity = require('../models/GamesToCity')
const {check, validationResult} = require('express-validator')
const mongoose = require('mongoose')
const authMiddleware = require('../middleware/auth.middleware')
const Lead = require('../models/Lead')
const router = Router()
const moment = require('moment')
const Game = require('../models/Game')
const Commets = require('../models/Commets')
const { route } = require('./auth.router')

function init(io){
router.post('/getclient',authMiddleware,async(req,res)=>{
    try {
        const phoneFind = req.body.phone
        const reg = new RegExp(phoneFind)
        const candidatesBase = await LeadsToCity.findOne({owner: req.user.cityId},{_id: 1})
        const candidates = await Lead.find({owner: candidatesBase._id, phone: {$regex: reg, $options: 'i'}})
        console.log(candidates)
    if (!candidates){
        return res.status(404).json({message: "Нет таких"})
    }
    return res.status(200).json(candidates)
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
        const {clientName, phone} = req.body
        const candidatesBase = await LeadsToCity.find({owner: req.user.cityId},{_id: 1})
        const candidate = await Lead.find({owner: candidatesBase._id, phone: phone})
        if(candidate.length){
            return res.status(404).json({message: "Данный лид уже создан"})
        }
        const lead = await new Lead({phone, name: clientName, date: moment().valueOf(), owner: candidatesBase[0]._id})
        await lead.save()
        await LeadsToCity.updateOne({owner: req.user.cityId}, {$push: {leads: lead._id}})
        return res.status(201).json(lead)
    } catch (error) {
        console.log(error)
        return res.status(501).json({message: 'Что то пошло не так'})
    }
})
router.post('/creategame', authMiddleware, async(req,res)=>{
    try {
        const {date, duration, type, address, col, summ, prepay, evening, client, age, inventory, gamesToCityId} = req.body
        console.log(req.body)
        if(type === 2 && address === ''){
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
        const gamesBase = await GamesToCity.findById(gamesToCityId,{_id: 1, version: 1})
        const game = await new Game({
            lead: client, 
            date: date, 
            dateOfCreation: moment().valueOf(), 
            col, 
            summ, 
            prepay, 
            evening, 
            duration,
            workers, 
            type, 
            address: address,
            age,
            version: gamesBase.version + 1 ,
            inventory,
            status: 0,
            removed: false,
            owner: gamesBase._id,
            creator: req.user.userId,
            comments: []
        })
        await game.save()
        await GamesToCity.findByIdAndUpdate(gamesToCityId, {$push: {games: game._id}, $inc: {version: 1} 
    }
        );
        io.to(req.user.cityId).emit('addedGame', {message: `добавлена игра ${moment(date).format('D/M/H HH:mm') + ' ' + gamesBase.name}`})
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
        const gamesBase = await GamesToCity.findOne({owner: req.user.cityId},{_id: 1, version: 1})
        const games = await Game.find({owner: gamesBase._id, removed: false, date: {$lte: max, $gte: min}})
        return res.status(200).json(games)
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
        const client = await Lead.findById(clientId)
        return res.status(200).json(client)
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
        const game = await Game.findById(id)
        if(game.removed){
            return res.status(400).json({
                message: "Игра удалена"
            })
        }
        return res.status(200).json(game)
    } catch (error) {
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
router.post('/deleteGame', authMiddleware, async(req,res) => {
    try {
        const {id} = req.body
        const game = await Game.findById(id, {version: 1, _id: 1,owner: 1})
        const gamesToCity = await GamesToCity.findById(game.owner)
        await Game.findByIdAndUpdate(id, {$set: {removed: true}, version: gamesToCity.version + 1})
        await GamesToCity.findByIdAndUpdate(gamesToCity._id, {version: gamesToCity.version + 1})
        io.to(req.user.cityId).emit('addedGame', {message: `Удалена игра ${moment(game.date).format('D/M/Y HH:mm')}`})
        return res.status(200).json({message: 'ok'})
    }
     catch (error) {
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
router.post('/createStudio', authMiddleware, async(req, res) => {
    try {   
        const name = req.body.name.trim()
        const {cityId} = req.user
        const candidate = await GamesToCity.find({owner: cityId, name: name})
        console.log(candidate)
        if(candidate.length){
            return res.status(400).json({
                message: 'Данное имя уже используется для другой студии'
            })
        }
        if(name.length < 1) {
            return res.status(400).json({
                message: 'Введите Имя'
            })
        }
        const newStudio = await new GamesToCity({
            owner: cityId,
            games: [],
            version: 0,
            name: name,
            type: 'usual'
        })
        await newStudio.save()
        io.to(cityId).emit('newStudio', {message: `Созданна новая студия: ${newStudio.name}`, studio: newStudio})
        return res.status(201).json(newStudio._id)

    } catch (error) {
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
router.post('/deleteStudio', authMiddleware, async(req,res) => {
    try {
        const {id} = req.body
        const studioToDelete = await GamesToCity.findById(id)
        const {userId} = req.user
        const user = await User.findById(userId)
        if(user.type > 2){
            return res.status(400).json({
                message: "У вас нет доступа для удаления календаря студии"
            })
        }
        if(studioToDelete.type === 'main'){
            return res.status(400).json({
                message: "Нельзя удалить основную студию"
            })
        }
        await GamesToCity.findByIdAndDelete(id)
        io.to(req.user.cityId).emit('studioDeleted', {message: `Удалена студия: ${studioToDelete.name}`, studioToDelete: studioToDelete})
        return res.status(200).json({
            message: 'Игра удалена'
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
router.post('/createPost', authMiddleware, async(req,res)=>{
    try{
        const {date,type,message, gameId} = req.body
        const {userId,cityId} = req.user
        if(!message || !type || !gameId || !date) {
            console.log(req.body)
            return res.status(400).json({
                message: "Неправильно заполнены данные"
            })
        }
        const gamesBase = await Game.findById(gameId,{owner: 1})
        const comment = await new Commets({
            createDate: moment().valueOf(),
            date: Number(date),
            message,
            owner: gameId,
            status: 0,
            type,
            creator: userId,
            GamesBase: gamesBase.owner
        })
        await comment.save()
        const game = await Game.findByIdAndUpdate(gameId,{$inc: {version: 1}, $push: {comments: comment._id}})
        await GamesToCity.findByIdAndUpdate(game.owner, {$inc: {version: 1}})
        io.to(cityId).emit(
            'addedGame', 
            {
                message: `Добавлено событие к игре ${moment(game.date).format('D/M/Y HH:mm')}`, 
            }
            )
        return res.status(201).json({
            message: "ok",
            comment: comment
        })
    }
    catch (error){
        console.log(error)
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
router.post('/getComments', authMiddleware, async(req, res) => {
    try {
        const {id} = req.body
        const data = await Commets.find({owner: id}).sort({date: 1})
        
        return res.status(200).json(data)
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
const types = {
    date: 'Дата',
    lead: 'Заказчик',
    workers: 'Работники',
    status: 'Статус',
    address: 'Адрес',
    summ: 'Сумма',
    prepay: 'Предоплата',
    age: 'Возраст',
    duration: 'Продолжительность',
    evening: 'Вечер',
    inventory: 'Инвентарь',
    col: 'Количество',
    type: 'Локация'
}
router.post('/updatePropertyOfGame', authMiddleware, async(req,res) => {
    try {
        const {id, type, value} = req.body
        const {cityId} = req.user
        const oldGame = await Game.findById(id, {[type]: 1})
        console.log(req.body)
        await Game.findByIdAndUpdate(id, {[type]: value,$inc: {version: 1}})
    await GamesToCity.findByIdAndUpdate(oldGame.owner, {$inc: {version: 1}})
        const messageCreate = (type) => {
            switch(type){
                case 'date':
                    return `Внесены изминения у игры ${moment(oldGame.date).format('D/M/Y HH:mm')}.Изменено свойство ${types[type]} с ${moment(oldGame[type]).format('D/M/Y HH:mm')} на ${moment(value).format('D/M/Y HH:mm')} `;
                case 'type':
                    return `Внесены изминения у игры ${moment(oldGame.date).format('D/M/Y HH:mm')}.Изменено свойство ${types[type]} с ${oldGame[type]===0?'Студия':'Выезд'} на ${value===0?'Студия':'Выезд'} `;
                default :
                    return `Внесены изминения у игры ${moment(oldGame.date).format('D/M/Y HH:mm')}.Изменено свойство ${types[type]} с ${oldGame[type]} на ${value}`;
            }
               
        }
        io.to(cityId).emit(
            'changedGame', 
            {
                message: messageCreate(type), 
            }
            )
        return res.status(200).json({
            ok: true
        })
    } catch (error) {
        return res.status(400).json({
            message: "Что-то пошло не так попробуйте чуть позже"
        })
    }
})
return router
}

module.exports = init