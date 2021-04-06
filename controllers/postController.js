const Post = require('../models/Post')

//
// GET request to /create-post comes here ---------------------------------------------------------
//
exports.viewCreateScreen = function (req, res) {
  res.render('create-post')
}


//
// POST request to /create-post comes here --------------------------------------------------------
//
exports.create = function (req, res) {
  let post = new Post(req.body, req.session.user._id) // data in first param, userid in second param
  post.create()
    .then(
      function (newId) {
        req.flash("success", "New post successfully created.")
        req.session.save(() => res.redirect(`/post/${newId}`))
      }
    )
    .catch(
      function (errors) {
        errors.forEach(error => req.flash("errors", error))
        req.session.save(() => res.redirect("create-post"))
      }
    )
}

//
// GET request to /post/:id come here ---------------------------------------------------------
//
exports.viewSingle = async function (req, res) {

  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    res.render('single-post-screen', { post: post })
  }
  catch {
    res.render('404')
  }

}



//
// GET request to /post/:id/edit --------------------------------------------------------------
//

// his new code from lesson 86
exports.viewEditScreen = async function (req, res) {
  try {
    let post = await Post.findSingleById(req.params.id, req.visitorId)
    if (post.isVisitorOwner) {
      res.render("edit-post", { post: post })
    } else {
      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(() => res.redirect("/"))
    }
  } catch {
    res.render("404")
  }
}

// MY OLD WORKING CODE
// exports.viewEditScreen = async function (req, res) {
//   try {
//     let post = await Post.findSingleById(req.params.id, req.visitorId)
//     console.log("post.authorId=" + post.authorId + " req.visitorId=" + req.visitorId) // debug
//     if (post.authorId == req.visitorId) {
//       res.render("edit-post", { post: post })
//     } else {
//       console.log("before flash......")
//       req.flash("errors", "You do not have authority to do that.")
//       console.log(".....after flash")
//       req.session.save(() => res.redirect("/"))
//     }
//   } catch {
//     res.render("404")
//   }
// }

//
// POST request to /post/:id/edit -------------------------------------------------------------
//
exports.edit = function (req, res) {

  console.log("in .edit. req.visitorId= " + req.visitorId)
  console.log("in .edit. req.params.id= " + req.params.id)

  let post = new Post(req.body, req.visitorId, req.params.id)

  post.update()
    .then((status) => {
      if (status == "success") {
        // the post was updated successfully
        req.flash("success", "Post successfully updated.")
        req.session.save(function () {
          res.redirect(`/post/${req.params.id}/edit`)
        })
      } else {
        //  user had permisssion but failed validation errors
        post.errors.forEach(function (error) {
          req.flash("errors", error)
        })
        req.session.save(function () {
          res.redirect(`/post/${req.params.id}/edit`)
        })
      }
    })
    .catch(() => {
      // a post with the requested ID doesn't exist, or if visitor is not the post owner
      req.flash("errors", "You do not have permission to do that.")
      req.session.save(function () {
        res.redirect("/")
      })
    })
}


//
// POST request to /post/:id/delete ----------------------------------------------------------------
//
exports.delete = function (req, res) {
  Post.delete(req.params.id, req.visitorId)
    .then(() => {

      req.flash("success", "Post successfully deleted.")
      req.session.save(() => res.redirect(`/profile/${req.session.user.username}`))

    })
    .catch(() => {

      req.flash("errors", "You do not have permission to perform that action.")
      req.session.save(() => res.redirect("/"))

    })
}

exports.search = function (req, res) {

  Post.search(req.body.searchTerm)
    .then(posts => { res.json(posts) })
    .catch(() => { res.json([]) })

}




// ENDS postController.js