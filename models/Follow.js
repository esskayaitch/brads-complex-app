const usersCollection = require("../db").db().collection("users")
const followsCollection = require("../db").db().collection("follows")
const ObjectID = require('mongodb').ObjectID
const User = require('./User')

//
// Constructor ------------------------------------------------------------------------------------
//
let Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername
  this.authorId = authorId
  this.errors = []
} // ENDS constructor
//

//
// check that the username is just a string -------------------------------------------------------
//
Follow.prototype.cleanUp = function () {
  if (typeof (this.followedUsername) != "string") { this.followedUsername = "" }
} // ENDS cleanUp()
//

//
// check that the user being followed exists in the DB --------------------------------------------
//
Follow.prototype.validate = async function (action) {

  // followedUsername must exist in database
  let followedAccount = await usersCollection.findOne({ username: this.followedUsername })

  if (followedAccount) {
    this.followedId = followedAccount._id
  } else {
    this.errors.push("You cannot follow a user who does not exist!")
  }
  let doesFollowAlreadyExist = await followsCollection.findOne({
    followedId: this.followedId, authorId: new ObjectID(this.authorId)
  })

  console.log("Action=" + action)                                              // debug

  // already following - cannot happen!!! The "follow" button should not have appeared on the screen.
  if (action == "create") {
    if (doesFollowAlreadyExist) { this.errors.push("You are already following this user.") }
  }
  //  cannot delete if you are not following already
  if (action == "delete") {
    if (!doesFollowAlreadyExist) { this.errors.push("You are not following this user.") }
  }
  // should not folow yourself
  if (this.followedId.equals(this.authorId)) {
    { this.errors.push("You cannot follow yourself.") }
  }
} // ENDS validate()
//

//
// Add this visitor as a follower of this user ----------------------------------------------------
//
Follow.prototype.create = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate("create") // "create tells the validate function what action called it ---- 
    if (!this.errors.length) {
      await followsCollection.insertOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) })
      resolve()
    } else {
      reject(this.errors)
    }
  })
} // ENDS create()
//

//
// Add this visitor as a follower of this user ----------------------------------------------------
//
Follow.prototype.delete = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate("delete")  // "delete" tells the validate function what action called it --
    if (!this.errors.length) {
      await followsCollection.deleteOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) })
      resolve()
    } else {
      reject(this.errors)
    }
  })
} // ENDS delete()
//

//
// Check to see if the current visitor is following this user -------------------------------------
//
Follow.isVisitorFollowing = async function (followedId, visitorId) {

  console.log("followedId=" + followedId)                               // debug
  console.log("visitorId=" + visitorId)                                 // debug

  let followDoc = await followsCollection.findOne(
    {
      followedId: followedId,
      authorId: new ObjectID(visitorId)
    }
  )
  if (followDoc) {
    return true
  } else {
    return false
  }
} // ENDS isVisitorFollowing()
//

//
// Get the users who are following this user ------------------------------------------------------
//
Follow.getFollowersById = function (id) {
  // console.log("in getFollowersById, followed ID =" + id)                     // debug
  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followsCollection.aggregate([
        { $match: { followedId: id } },
        { $lookup: { from: "users", localField: "authorId", foreignField: "_id", as: "userDoc" } },
        {
          $project: {
            username: { $arrayElemAt: ["$userDoc.username", 0] },
            email: { $arrayElemAt: ["$userDoc.email", 0] }
          }
        }
      ]).toArray()
      followers = followers.map(function (follower) {
        let user = new User(follower, true)
        return { username: follower.username, avatar: user.avatar }
      })
      resolve(followers)
    }
    catch {
      reject()
    }
  })
} // ENDS getFollowersById()
//

//
// Get the users who are following this user ------------------------------------------------------
//
Follow.getFollowingById = function (id) {

  console.log("+++ in getFollowingById, id=" + id)                             // debug

  return new Promise(async (resolve, reject) => {
    try {
      let followers = await followsCollection.aggregate([
        { $match: { authorId: id } },
        { $lookup: { from: "users", localField: "followedId", foreignField: "_id", as: "userDoc" } },
        {
          $project: {
            username: { $arrayElemAt: ["$userDoc.username", 0] },
            email: { $arrayElemAt: ["$userDoc.email", 0] }
          }
        }
      ]).toArray()

      console.log("-=-= following=" + followers)                                    // debug
      // console.log("-+-+ userDoc=" + userDoc)                                        // debug

      followers = followers.map(function (follower) {
        let user = new User(follower, true)
        return { username: follower.username, avatar: user.avatar }
      })
      resolve(followers)
    }
    catch {
      reject()
    }
  })
} // ENDS getFollowersById()
//

//
// Get the number of followers of this author -----------------------------------------------------
//
Follow.countFollowersById = function(id) {
  return new Promise(async (resolve, reject) => {
    let followerCount = await followsCollection.countDocuments({followedId: id})
    resolve(followerCount)
  })
} // ENDS Post.countPostsByAuthor()

//
// Get the number of users this author is following -----------------------------------------------
//
Follow.countFollowingById = function(id) {
  return new Promise(async (resolve, reject) => {
    let followingCount = await followsCollection.countDocuments({authorId: id})
    resolve(followingCount)
  })
} // ENDS Post.countPostsByAuthor()


module.exports = Follow

//
// ENDS Follow.js
// 