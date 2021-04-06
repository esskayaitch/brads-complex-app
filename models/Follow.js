const usersCollection = require("../db").db().collection("users")
const followsCollection = require("../db").db().collection("follows")
const ObjectID = require('mongodb').ObjectID

//
// Constructor ------------------------------------------------------------------------------------
//
let Follow = function (followedUsername, authorId) {
  this.followedUsername = followedUsername
  this.authorId = authorId
  this.errors = []
}
//
// check that the username is just a string -------------------------------------------------------
//
Follow.prototype.cleanUp = function () {
  if (typeof (this.followedUsername) != "string") { this.followedUsername = "" }
}

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


  console.log("Action=" + action)                         // debug

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


}

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
}

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
}


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

  console.log("followDoc=" + followDoc)

  if (followDoc) {
    return true
  } else {
    return false
  }
}




module.exports = Follow

//
// ENDS Follow.js
// 