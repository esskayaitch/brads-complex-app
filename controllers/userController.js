const { response } = require('express')
const User = require('../models/User')
const Post = require('../models/Post')



//
// check the user is logged in --------------------------------------------------------------------
//
exports.mustBeLoggedIn = function (req, res, next) {
  if (req.session.user) {
    next()
  } else {
    req.flash("errors", "You must be logged in to perform that action.")
    req.session.save(function () {
      res.redirect('/')
    })
  }

}

//
// login the user if details verified -------------------------------------------------------------
//
exports.login = function (req, res) {

  let user = new User(req.body)

  user.login()
    .then(function (result) {
      req.session.user = { avatar: user.avatar, username: user.data.username, _id: user.data._id }
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

//
// logout the user --------------------------------------------------------------------------------
//
exports.logout = function (req, res) {
  req.session.destroy(function () {
    res.redirect('/')                       // when session destroy completes
  })

}

//
// register the user in the db --------------------------------------------------------------------
//
exports.register = function (req, res) {

  let user = new User(req.body)

  user.register()
    .then(() => {                           // get the username
      req.session.user = { avatar: user.avatar, username: user.data.username, _id: user.data._id } 
      req.session.save(function () {        // because we don't know how long req.flash() will take ...
        res.redirect('/')                   // ... redirect only when session save() has finished (async)
      })
    })
    .catch((regErrors) => {                 // flash out the errors
      regErrors.forEach(function (message) {
        req.flash('regErrors', message)
      })
      req.session.save(function () {        // because we don't know how long req.flash() will take ...
        res.redirect('/')                   // ... redirect only when session save() has finished (async)
      })
    })
}

//
// render home page -------------------------------------------------------------------------------
//
exports.home = function (req, res) {

  if (req.session.user) {
    res.render('home-dashboard')
  } else {
    res.render('home-guest', { regErrors: req.flash('regErrors') })
  }
}

//
// confirm that there are posts under this name ---------------------------------------------------
//
exports.ifUserExists = function (req, res, next) {

  User.findByUsername(req.params.username)
    .then(function (userDocument) {

      req.profileUser = userDocument
      next()

    })
    .catch(function () {

      res.render("404")                     // there are no documents with that author name

    })

}

//
// Display the posts by this user -----------------------------------------------------------------
//
exports.profilePostsScreen = function (req, res) {

  Post.findByAuthorId(req.profileUser._id)

    .then(function (posts) {

      res.render('profile', {
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar
      })


    })
    .catch(function () {

      res.render("404")

    })

}

// ENDS userController.js