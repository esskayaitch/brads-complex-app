const express = require ('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')

const app = express()

let sessionOptions = session({
  secret: "Randon stuff mumble mumble mumble ",
  store: new MongoStore({client: require('./db')}),
  resave: false,
  saveUninitialized: false,
  cookie: {maxAge: 1000 * 60 * 60 * 24, httpOnly: true} // 24 hours
})

app.use(sessionOptions)
app.use(flash())

const router = require('./router') // run this js file now

app.use(express.urlencoded({extended: false}))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'views') // where views are stored
app.set('view engine', 'ejs') // name of view engine

app.use('/', router)

module.exports = app

// ENDS app.js