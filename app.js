const express = require('express')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)
const flash = require('connect-flash')
const markdown = require('marked')
const sanitizeHTML = require('sanitize-html')


const app = express()

let sessionOptions = session({
  secret: "Randon stuff mumble mumble mumble ",
  store: new MongoStore(
    {
      client: require('./db') // 
    }
  ),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
    httpOnly: true
  }                                         // 24 hours in milliseconds
})

app.use(sessionOptions)                     // start session
app.use(flash())                            // load flash

app.use(function (req, res, next) {


  // make our markdown fnuction available from within our ejs templates
  res.locals.filterUserHTML = function (content) {
    return sanitizeHTML(markdown(content), {
      allowedTags: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'bold', 'i', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      allowedAttributes: []
    })
  }

  // make current user id available on the req oblect
  if (req.session.user) { req.visitorId = req.session.user._id } else { req.visitorId = 0 }

  // make user session data availble from within ejs view templates
  res.locals.user = req.session.user

  // make all error and success flash messages available to all templates
  res.locals.errors = req.flash("errors")
  res.locals.success = req.flash("success")

  next()
})

const router = require('./router')          // run this js file now

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'views')                   // where views are stored
app.set('view engine', 'ejs')               // name of view engine

app.use('/', router)

module.exports = app

// ENDS app.js