const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const config = require('config')
const User = require('./models/User')
const Leads = require('./models/Leads')
const Room = require('./models/Room')
const Games = require('./models/Games')


module.exports = function (http) {
    const io = require('socket.io')(http)

    io.sockets.on('connection', (socket) => {
        console.log('connected')
        socket.on('joinRoom', async () => {
            try {
                let { userId, cityId } = socket.handshake.auth.token
            let newUserConnected = {
                userId,
                conId: socket.id
            }
            socket.join(cityId)
            await Room.updateOne({owner: cityId}, {$pull: {clients: {userId: userId}}})
            await Room.updateOne({owner: cityId},{$push: {clients: newUserConnected}})
            socket.emit('JoinedRoom',{ok:true})
            } catch (error) {
                console.log(error)
                socket.emit('JoinedRoom',{ok:false})
                socket.leave(cityId)
            }
        })
        socket.on('disconnect', async() => {
            let { userId, cityId } = socket.handshake.auth.token
            await Room.updateOne({owner: cityId}, {$pull: {clients: {conId: socket.id}}})
        })
        socket.on('sync', async( version) => {
            let { userId, cityId } = socket.handshake.auth.token
            const data = await Games.aggregate(
                [{$match: {owner: cityId}},
                {$unwind: '$games'},
                {$match: {'games.version': {$gt: version}}}]
            )
            const newVersion = await Games.aggregate([
                {$match: {owner: cityId}},
                {$project: {'version': '$version'}}
            ]
            )
            let gamesToDelete = []
            let games = []
            data.map((item)=>{
                if(!item.games.hasOwnProperty('removed')){
                    games.push(item.games)
                }else{
                    gamesToDelete.push(item.games)
                }
            }) 
            console.log(gamesToDelete)
            socket.emit('updateData', {games, gamesToDelete, version: newVersion[0].version})
        })
    })

    io.use((socket, next) => {
        if (!socket.handshake.auth.token) {
            const err = new Error("not authorized");

            err.data = { content: "Please retry later" }; // additional details
            next(err);
        } else {
            try {
                const decoded = jwt.verify(socket.handshake.auth.token, config.get("jwtSecret"))
                socket.handshake.auth.token = decoded
                next()
            } catch (error) {
                console.log(error)
            }

        }
    });
    return io
}