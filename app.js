const express = require ('express')
const app = express()

const router = require('./router') // run this js file now

app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'views') // where views are stored
app.set('view engine', 'ejs') // name of view engine

app.use('/', router)

module.exports = app