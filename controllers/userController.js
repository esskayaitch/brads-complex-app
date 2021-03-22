const { response } = require('express')
const User = require('../models/User')

// login the user if details verified
exports.login = function (req, res) {

  let user = new User(req.body)

  user.login()
    .then(function (result) {
      req.session.user = { avatar: user.avatar, username: user.data.username }
      req.session.save(function () {
        res.redirect('/')
      })
    }
    )
    .catch(function (err) {
      req.flash('errors', err)
      req.session.save(function () {
        res.redirect('/')
      })
    }
    )
}


// logout the user

exports.logout = function (req, res) {
  req.session.destroy(function () {
    res.redirect('/') // when session destroy completes
  })

}


// register the user in the db

exports.register = function (req, res) {

  let user = new User(req.body)

  user.register()
    .then(() => {
      req.session.user = { avatar: user.avatar, username: user.data.username } // get the username
      req.session.save(function () { // because we don't know how long req.flash() will take ...
        res.redirect('/') // ... redirect only when session save() has finished (async)
      })
    })
    .catch((regErrors) => { // flash out the errors
      regErrors.forEach(function (message) {
        req.flash('regErrors', message)
      })
      req.session.save(function () { // because we don't know how long req.flash() will take ...
        res.redirect('/') // ... redirect only when session save() has finished (async)
      })
    })
}

// render home page

exports.home = function (req, res) {

  if (req.session.user) {
    res.render('home-dashboard', { username: req.session.user.username, avatar: req.session.user.avatar })
  } else {
    res.render('home-guest', { errors: req.flash('errors'), regErrors: req.flash('regErrors') })
  }
}

// ENDS userController.js