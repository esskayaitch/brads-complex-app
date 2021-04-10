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
  }                                                           // 24 hours in milliseconds
})

app.use(sessionOptions)                                       // start session
app.use(flash())                                              // load flash

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

const router = require('./router')                            // run this js file now

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

app.use(express.static('public'))
app.set('views', 'views')                                     // where views are stored
app.set('view engine', 'ejs')                                 // name of view engine
app.use('/', router)                                          // use router.js when the root directory is a get request

// socket stuff -----------------------------------------------------------------------------------

const server = require('http').createServer(app)              // needed to use socket.io
const io = require('socket.io')(server)                       // link socket layer to the server we just created - ??? research skh

io.use(function (socket, next) {
  sessionOptions(socket.request, socket.request.res, next)     // makes express session data available to socket.io
})

io.on('connection', function (socket) {

  if (socket.request.session.user) {
    let user = socket.request.session.user                      // get the user info

    socket.emit('Welcome', { username: user.username, avatar: user.avatar })

    socket.on('chatMessageFromBrowser', function (data) {
      // console.log(data.message)                              // debug +++ 
      socket.broadcast.emit('chatMessageFromServer', {          // send to everyone except me
        // message: data.message,                               // THIS HAS NO SECURITY - DANGER
        message: sanitizeHTML(data.message, {
          allowedTags: [],
          allowedAttributes: {}
        }), // no tags, no attributes
        username: user.username,
        avatar: user.avatar
      }) // send message to all users with chat window open
    })

  }

}) // ENDS io.on()

module.exports = server

// ENDS app.js