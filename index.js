const express = require('express')
const config = require('config')
const mongoose = require('mongoose')
const app = express()
const http = require('http').Server(app)
app.use(express.json({extended: true}))
app.use('/api/auth', require('./routes/auth.router'))
const PORT = config.get('PORT') || 5000
const path = require('path')

const start = async() => {
    try {
        const connect = await mongoose.connect(config.get('mongoUri'),{
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false
        })
        http.listen(PORT, ()=>console.log('СТАРТАНУЛИ НА ПОРТЕ:',PORT))
    } catch (e) {
        console.log("SERVER ERROR:",e.message)
        process.exit(1)
    }
}
const io = require('./Sinc')(http)
const games = require('./routes/games.router')(io)

app.use('/api/games', games)
app.use('/api/images', require('./routes/images.router'))
const staticPath = path.join(__dirname, './privacy')
app.use('/', express.static(staticPath))
start()