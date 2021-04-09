const postsCollection = require('../db').db().collection("posts")
const followsCollection = require('../db').db().collection("follows")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')
const sanitizeHTML = require('sanitize-html')

//
// Post constructor finction ----------------------------------------------------------------------
//
let Post = function (data, userid, requestedPostId) {

  this.data = data               // req.body data comes in through first parameter
  this.userid = userid             // userid comes from second parameter
  this.requestedPostId = requestedPostId    // post ID requested by update
  this.errors = []

} // ENDS Post constructor
//
// clean up user data -----------------------------------------------------------------------------
//
Post.prototype.cleanUp = function () {

  if (typeof (this.data.title) != "string") { this.data.title = "" }
  if (typeof (this.data.body) != "string") { this.data.body = "" }

  // get rid of bogus properties & add created date
  this.data = {
    title: sanitizeHTML(this.data.title.trim(), { allowedTags: [], allowedAttributes: [] }),
    body: sanitizeHTML(this.data.body.trim(), { allowedTags: [], allowedAttributes: [] }),
    createdDate: new Date(),
    author: ObjectID(this.userid)
  }
} // ENDS Post.cleanup()
//
// validate user data -----------------------------------------------------------------------------
//
Post.prototype.validate = function () {

  if (this.data.title == "") { this.errors.push("You must provide a title.") }
  if (this.data.body == "") { this.errors.push("You must provide post content.") }

} // ENDS Post.validate()

//
// create user post -------------------------------------------------------------------------------
//
Post.prototype.create = function () {

  return new Promise((resolve, reject) => {
    this.cleanUp()
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
} // ENDS Post.create

//
// Check that we should update the user's Post ----------------------------------------------------
//
Post.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log("at 1 - postID = " + this.requestedPostId + ". userid = " + this.userid) // debug - check IDs

      let post = await Post.findSingleById(this.requestedPostId, this.userid)

      // console.log("at 2 - postID = " + this.requestedPostId + ". userid = " + this.userid) // debug - check IDs

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
} // ENDS Post.update()2

//
// Having checked that we have good data and authority we can go ahead and update the database ----
//
Post.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
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
} // ENDS Post.actuallyUpdate()

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
} // ENDS Post.findSingleById()

//
// Retrieve posts for a known author --------------------------------------------------------------
//
Post.findByAuthorId = function (authorId) {

  return Post.reusablePostQuery([

    { $match: { author: authorId } },
    { $sort: { createdDate: -1 } }

  ])
} // ENDS Post.findByAuthorId()

//
// shared function to retrieve a post by either user ID -> post ID --------------------------------
//   or by author depending on params ---------
//
Post.reusablePostQuery = function (uniqueOperations, visitorId, finalOperations = []) {

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
          author: { $arrayElemAt: ["$authorDocument", 0] }  // Set author to the first element (0) of the $authorDoument array
        }
      }
    ]).concat(finalOperations)

    // The following code works because we know that each post only has a single author, 
    // and therefore the $lookup (join) will only return a single document in the authorDocument[] array.

    let posts = await postsCollection.aggregate(aggOperations).toArray()
    // clean up author property in each post object
    posts = posts.map(function (post) {                      // rebuild the posts with the following elements
      post.isVisitorOwner = post.authorId.equals(visitorId)  // Set flag to say the visitor owns the post, or not
      post.authorId = undefined                              // empty author ID field so it's not exposed in the browser
      post.author = {                                        // post.author should only have
        username: post.author.username,                      // the username from the autthorDicument
        avatar: new User(post.author, true).avatar           // the avatar link (by using the getAvatar() from the User model)
      }
      return post
    })

    resolve(posts)
  })
} // ENDS Post.reusablePostQuery()

//
// delete a post ----------------------------------------------------------------------------------
//
Post.delete = function (postIdToDelete, currentUserId) {

  console.log("postIdToDelete=" + postIdToDelete + ". currentUserId=" + currentUserId + ".")

  return new Promise(async (resolve, reject) => {
    try {
      let post = await Post.findSingleById(postIdToDelete, currentUserId)

      if (post.isVisitorOwner) {
        console.log("about to delete")
        await postsCollection.deleteOne({ _id: new ObjectID(postIdToDelete) }) // get MongoDB to delete the document
        console.log("after deleteOne")
        resolve()
      } else {

        console.log("not owner so cannot delete")

        reject() // request from user without authority
      }
    }
    catch {

      console.log("not found so cannot delete")

      reject() // post ID not valid or the post doesn't exist
    }
  })
} // ENDS Post.delete()

//
// search all posts -------------------------------------------------------------------------------
//
Post.search = function (searchTerm) {

  return new Promise(async (resolve, reject) => {

    if (typeof (searchTerm) == "string") {
      let posts = await Post.reusablePostQuery(
        [{ $match: { $text: { $search: searchTerm } } }],  // param1 $txt array
        undefined,                                         // param2 undefined, we don't need the visitorId here
        [{ $sort: { score: { $meta: "textScore" } } }]     // param3 $sort array
      )
      resolve(posts)
    } else {
      reject()                                             // bad search,  not string
    }
  })
} // ENDS Post.search()

//
// Get the number of documents by this author -----------------------------------------------------
//
Post.countPostsByAuthor = function (id) {
  return new Promise(async (resolve, reject) => {
    let postCount = await postsCollection.countDocuments({ author: id })
    resolve(postCount)
  })
} // ENDS Post.countPostsByAuthor()

//
//
//

Post.getFeed = async function (id) {

  // create an array of the user id's that the current user follows

  let followedUsers = await followsCollection.find({
    authorId: new ObjectID(id)
  }).toArray()                                                       // get all the docs
  followedUsers = followedUsers.map(function (followDoc) {           // replace the array of all the docs with a
    return followDoc.followedId                                      // new array of just the followedId's
  })

  // look for posts where the author is in the above array of followed users

  return Post.reusablePostQuery([
    {$match: {author: {$in: followedUsers}}},              // return any post where the author is in the followedUsers array
    {$sort: {createdDate: -1}}                             // sort desc
  ])

}






module.exports = Post

//
// ENDS Post.js
//