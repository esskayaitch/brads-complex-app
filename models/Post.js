const postsCollection = require('../db').db().collection("posts")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHTML = require('sanitize-html') 

//
// Post constructor finction ----------------------------------------------------------------------
//
let Post = function (data, userid, requestedPostId) {

  this.data            = data               // req.body data comes in through first parameter
  this.userid          = userid             // userid comes from second parameter
  this.requestedPostId = requestedPostId    // post ID requested by update
  this.errors          = []

}

// clean up user data -----------------------------------------------------------------------------

Post.prototype.CleanUp = function () {

  if (typeof (this.data.title) != "string") { this.data.title = "" }
  if (typeof (this.data.body) != "string") { this.data.body = "" }

  // get rid of bogus properties & add created date
  this.data = {
    title: sanitizeHTML(this.data.title.trim(), { allowedTags: [], allowedAttributes: [] }),
    body: sanitizeHTML(this.data.body.trim(), { allowedTags: [], allowedAttributes: [] }),
    createdDate: new Date(),
    author: ObjectID(this.userid)
  }

}

// validate user data -----------------------------------------------------------------------------

Post.prototype.validate = function () {

  if (this.data.title == "") { this.errors.push("You must provide a title.") }
  if (this.data.body  == "") { this.errors.push("You must provide post content.") }

}


// create user post -------------------------------------------------------------------------------

Post.prototype.create = function () {

  return new Promise((resolve, reject) => {
    this.CleanUp()
    this.validate()

    if (!this.errors.length) { // if not zero then there are errors

      postsCollection.insertOne(this.data) // MongoDB sets up the promise
        .then(
          (info) => {
            resolve(info.ops[0]._id) // success
          })
        .catch(
          () => {
            this.errors.push("Please try again later. (DB issus)")
            reject(this.errors)
          })
    } else {
      reject(this.errors) // return errors
    }
  })
}

//
// Check that we should pdate the user's Post -------------------------------------------------------------------------
//
Post.prototype.update = function () {

  return new Promise(async (resolve, reject) => {
    try {


      console.log("at 1 - postID = " + this.requestedPostId + ". userid = " + this.userid) // debug - check IDs


      let post = await Post.findSingleById(this.requestedPostId, this.userid)

      console.log("at 2 - postID = " + this.requestedPostId + ". userid = " + this.userid) // debug - check IDs

      if (post.isVisitorOwner) {
        // actually update the DB
        let status = await this.actuallyUpdate()            // do the update now
        resolve(status)
      } else {
        reject()
      }
    } catch {
      reject() // fail
    }
  })
}

//
// Having checked that we have good data and authority we can go ahead and update the database
//
Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.CleanUp()
    this.validate()
    if (!this.errors.length) {
      await postsCollection.findOneAndUpdate(
        {
          _id: new ObjectID(this.requestedPostId)
        },
        {
          $set: {
            title: this.data.title,
            body: this.data.body
          }
        }
      )
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

//
// retrieve a single user post --------------------------------------------------------------------
//
Post.findSingleById = function (id, visitorId) {

  console.log("in findSingleById top. id = " + id + ". visitorId = " + visitorId) // debug

  return new Promise(async function (resolve, reject) {

    if (typeof (id) != "string" || !ObjectID.isValid(id)) { // is id a string and is it a Mongo ObjectID ?

      console.log("in findSingleById failed id test.")      // debug

      reject()                                              // fail
      return                                                // no further processing
    }
    // The following code works because we know that each post only has a single author, and so
    //  the $lookup (join) will only return a single document in authorDocument[0] array position.

    console.log("in findSingleById before call reusablePostQuery.") // debug

    let posts = await Post.reusablePostQuery([              // look for a single post
      {
        $match: { _id: new ObjectID(id) }                   // set ID as what we're looking for 
      }
    ], visitorId)                                           // send visitor ID so we can check ownership/authority

    if (posts.length) {                                     // if lenght != 0, ie: something was returned
      console.log(posts[0]) // debug - send out the post id
      resolve(posts[0])                                     // return the object 
    } else { 
      reject()                                              // otherwise fail 
    }
  })
}

//
// Retrieve posts for a known author --------------------------------------------------------------
//
Post.findByAuthorId = function (authorId) {

  return Post.reusablePostQuery([

    { $match: { author: authorId } },
    { $sort: { createdDate: -1 } }

  ])
}

//
// shared function to retrieve a post by either user ID -> post ID
//   or by author depending on params ---------
//
Post.reusablePostQuery = function (uniqueOperations, visitorId) {

  return new Promise(async function (resolve, reject) {

    let aggOperations = uniqueOperations.concat([           // Aggregation operations group values from multiple documents together
      {      
        $lookup: {                                          // Performs a left outer join to an unsharded collection in the same database
          from: "users",                                    // the collection in the same database to perform the join with
          localField: "author",                             // the field from the documents input to the $lookup stage
          foreignField: "_id",                              // the field from the documents in the from collection
          as: "authorDocument"                              // the name of the new array field to add to the input documents
        }
      },
      {
        $project: {                                         // Passes along the documents with the requested fields
          title: 1,                                         // Specifies the inclusion of title
          body: 1,                                          // Specifies the inclusion of body
          createdDate: 1,                                   // Specifies the inclusion of a createdDate
          authorId: "$author",                              // Save the author id (MongoDB syntax) before we change it
          author: { $arrayElemAt: ["$authorDocument", 0] }  // Set author to the first element (0) of the authorDoument array
        }
      }
    ])

    // The following code works because we know that each post only has a single author, 
    // and therefore the $lookup (join) will only return a single document in the authorDocument[] array.

    let posts = await postsCollection.aggregate(aggOperations).toArray()
    // clean up author property in each post object
    posts = posts.map(function (post) {                      // rebuild the posts with the following elements
      post.isVisitorOwner = post.authorId.equals(visitorId)  // Set flag to say the visitor owns the post, or not
      post.author = {                                        // post.uathor should only have
        username: post.author.username,                      // the username from the autthorDicument
        avatar: new User(post.author, true).avatar           // the avatar link (by using the getAvatar() from the User model)
      }
      return post
    })
console.log("posts retrieved in array = " + posts)

    resolve(posts)
  })
}



module.exports = Post