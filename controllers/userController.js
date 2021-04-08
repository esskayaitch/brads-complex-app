const { response } = require('express')
const User = require('../models/User')
const Post = require('../models/Post')
const Follow = require('../models/Follow')


//
// check the user is logged in and following the current profile ----------------------------------
//
exports.sharedProfileData = async function (req, res, next) {

  let isVisitorsProfile = false
  let isFollowing = false

  console.log("sharedProfileData req.profileUser._id=" + req.profileUser._id)     // debug - ok
  console.log("sharedProfileData req.VisitorId=" + req.visitorId)                 // debug - 

  if (req.session.user) {

    // set a variable to see if the visitor is viewing their own posts
    isVisitorsProfile = req.profileUser._id.equals(req.session.user._id)

    // check to see if there is a follow document already in MongoDB, return true if one exists.
    isFollowing = await Follow.isVisitorFollowing(req.profileUser._id, req.visitorId)
  }

  req.isVisitorsProfile = isVisitorsProfile
  req.isFollowing = isFollowing

  // retrieve post, follower and follwing counts - run simitaneously

  let postCountPromise = Post.countPostsByAuthor(req.profileUser._id)
  let followerCountPromise = Follow.countFollowersById(req.profileUser._id)
  let followingCountPromise = Follow.countFollowingById(req.profileUser._id)

  let [postCount, followerCount, followingCount] = await Promise.all([postCountPromise, followerCountPromise, followingCountPromise])

  req.postCount = postCount
  req.followerCount = followerCount
  req.followingCount = followingCount

  next() // move on to the next function called by router.js 

} // ENDS User.sharedProfileData()


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

} // ENDS mustBeLoggedIn()

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
} // ENDS user.login()

//
// logout the user --------------------------------------------------------------------------------
//
exports.logout = function (req, res) {
  req.session.destroy(function () {
    res.redirect('/')                       // when session destroy completes
  })

} // ENDS user.logout()

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
} // ENDS User.register()

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
} // ENDS ifUserExists()

//
// Display the posts by this user -----------------------------------------------------------------
//
exports.profilePostsScreen = function (req, res) {

  Post.findByAuthorId(req.profileUser._id)
    .then(function (posts) {
      res.render('profile', {
        currentPage: "posts",
        posts: posts,
        profileUsername: req.profileUser.username,
        profileAvatar: req.profileUser.avatar,
        isFollowing: req.isFollowing,
        isVisitorsProfile: req.isVisitorsProfile,
        counts: {
          postCount: req.postCount,
          followerCount: req.followerCount,
          followingCount: req.followingCount
        }
      })
    })
    .catch(function () {

      res.render("404")

    })
} // ENDS

//
// Get the users that are followers of this user --------------------------------------------------
//
exports.profileFollowersScreen = async function (req, res) {
  console.log("IN profileFollowersScreen ")
  try {
    // console.log("in try block")                            // debug
    let followers = await Follow.getFollowersById(req.profileUser._id)
    // console.log("followers=" + followers)                  // debug
    res.render('profile-followers', {
      currentPage: "followers",
      followers: followers,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount
      }
    })
  }
  catch {
    // console.log("in catch block")                                       // debug
    res.render('404')
  }
} // profileFollowersScreen()

//
// Get the users that are followers of this user --------------------------------------------------
//
exports.profileFollowingScreen = async function (req, res) {

  console.log(" === IN profileFollowingScreen, req.profileUser._id=" + req.profileUser._id) // debug

  try {
    // console.log("in try block")                                             // debug

    let following = await Follow.getFollowingById(req.profileUser._id)

    console.log("--- following=" + following)                                  // debug

    res.render('profile-following', {
      currentPage: "following",
      following: following,
      profileUsername: req.profileUser.username,
      profileAvatar: req.profileUser.avatar,
      isFollowing: req.isFollowing,
      isVisitorsProfile: req.isVisitorsProfile,
      counts: {
        postCount: req.postCount,
        followerCount: req.followerCount,
        followingCount: req.followingCount
      }
    })
  }
  catch {
    // console.log("in catch block")                                       // debug
    res.render('404')
  }
} // profileFollowingScreen()






// ENDS userController.js