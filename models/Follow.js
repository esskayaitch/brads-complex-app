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
Follow.prototype.validate = async function () {
  // followedUsername must exist in database
  let followedAccount = await usersCollection.findOne({ username: this.followedUsername })
  if (followedAccount) {
    this.followedId = followedAccount._id
  } else {
    this.errors.push("You cannot follow a user who does not exist")
  }
}
//
// cleanup the request ----------------------------------------------------------------------------
//
Follow.prototype.create = function () {

  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    await this.validate()
    if (!this.errors.length) {
      await followsCollection.insertOne({ followedId: this.followedId, authorId: new ObjectID(this.authorId) })
      resolve()
    } else {
      reject(this.errors)
    }
  })
}



module.exports = Follow

//
// ENDS Follow.js
// 