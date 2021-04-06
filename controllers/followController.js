const Follow = require('../models/Follow')

//
// add a user to this visitors list of people they follow
//
exports.addFollow = function(req, res) {

  let follow = new Follow(req.params.username, req.visitorId)

  follow.create()
  .then( () => {
    req.flash("success", `Successfully followed ${req.params.username}`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`))
  })

  .catch( (errors) => {
    errors.forEach(error => {
      req.flash("errors", error)
    })
    req.session.save(() => res.redirect('/')) // send to home page
  })
}

//
// remove a user from this visitors list of people they follow
//
exports.removeFollow = function(req, res) {

  let follow = new Follow(req.params.username, req.visitorId)

  follow.delete()
  .then( () => {
    req.flash("success", `You are no longer following ${req.params.username}`)
    req.session.save(() => res.redirect(`/profile/${req.params.username}`))
  })

  .catch( (errors) => {
    errors.forEach(error => {
      req.flash("errors", error)
    })
    req.session.save(() => res.redirect('/')) // send to home page
  })
}




//
// ENDS followController.js
//