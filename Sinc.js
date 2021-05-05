const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const config = require('config')
const GamesToCity = require('./models/GamesToCity')
const LeadsToCity = require('./models/LeadsToCity')
const Room = require('./models/Room')
const Game = require('./models/Game')


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
        socket.on('sync', async( version, studioId) => {
            let { userId, cityId } = socket.handshake.auth.token
            
            const newVersion = await GamesToCity.findById(studioId, {_id: 1, name: 1,version: 1})
            const data = await Game.find({owner: newVersion._id, version: {$gt: version}})
            console.log(newVersion)
            let gamesToDelete = []
            let games = []
            data.map((item)=>{
                if(item.removed===false){
                    games.push(item)
                }else{
                    gamesToDelete.push(item)
                }
            }) 
            socket.emit('updateData', {games, gamesToDelete, version: newVersion.version, studioId, studio: newVersion})
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