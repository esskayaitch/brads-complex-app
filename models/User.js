const bcrypt = require("bcryptjs")
const usersCollection = require('../db').db().collection('users') // pickup the users collection handle
const validator = require('validator')
const md5 = require("md5")

// define the User constructor

let User = function (data) {
  this.data = data
  this.errors = []
}

// local function to cleanup input data -------------------------------------------------------------------------

User.prototype.cleanUp = function () {
  if (typeof (this.data.username) != "string") { this.data.username = "" }
  if (typeof (this.data.email) != "string") { this.data.email = "" }
  if (typeof (this.data.password) != "string") { this.data.password = "" }

  // get rid of any dodgy unknown properties

  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  }
}

// local function to validate the user input details -------------------------------------------------------------

User.prototype.validate = function () {

  return new Promise(async (resolve, reject) => {

    if (this.data.username == "") { this.errors.push("A username is required.") }
    if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) { this.errors.push("A username can only contain a-z, A-Z, 0-9.") }
    if (!validator.isEmail(this.data.email)) { this.errors.push("A valid email format is required.") }
    if (this.data.password == "") { this.errors.push("A password is required.") }
    if (this.data.password.length > 0 && this.data.password.length < 8) { this.errors.push("A password must be 8 characters long.") }
    if (this.data.password.length > 50) { this.errors.push("A password cannot exceed 50 characters long.") }
    if (this.data.username.length > 0 && this.data.username.length < 3) { this.errors.push("A username must be 3 characters long.") }
    if (this.data.username.length > 30) { this.errors.push("A username cannot exceed 30 characters long.") }

    // If username is valid,  then chack for existance in db
    if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
      let usernameExists = await usersCollection.findOne({ username: this.data.username })
      if (usernameExists) { this.errors.push("That username is already being used.") }
    }
    // If email is valid,  then chack for existance in db
    if (validator.isEmail(this.data.email)) {
      let emailExists = await usersCollection.findOne({ email: this.data.email })
      if (emailExists) { this.errors.push("That email already is being used.") }
    }

    resolve() // called to indicate successful completion of validation rules

  })

}


// come here to let the user login -----------------------------------------------------------------

User.prototype.login = function () {

  return new Promise((resolve, reject) => {  // Promise needs to have => for this.username/password to work

    this.cleanUp()                              // cleanup the data (again???)

    // arrow function is needed again because mongodb findOne() would change 'this' to global/window context, 
    // but arrow function does not alter- 'this' so it will still be the current User object.

    usersCollection.findOne({ username: this.data.username })
      .then((attemptedUser) => {
        if (attemptedUser && (bcrypt.compareSync(this.data.password, attemptedUser.password))) {
          this.data = attemptedUser
          this.getAvatar()
          resolve("User verified.")              // document retrieved, and bcrypt good
        } else {
          reject("Invalid username / password.") // either document not retrieved, or bcrypt faied
        }
      }
      )
      .catch(function () {
        reject("Database has not responded.")    // database request failed
      }
      )
  })
}


// come here to register the user ----------------------------------------------------------

User.prototype.register = function () {

  return new Promise(async (resolve, reject) => {

    this.cleanUp()                               // cleanup the data
    await this.validate()                        // wait for validation to finish 
    if (!this.errors.length) {                   // only if there are no validation errors, save the data
      let salt = bcrypt.genSaltSync(10)          // hash the password
      this.data.password = bcrypt.hashSync(this.data.password, salt)
      await usersCollection.insertOne(this.data) // wait for the insert to complete
      this.getAvatar()
      resolve()                                  // register completed successfully
    } else {                                     // validation failed
      reject(this.errors)                        // return errors via reject()
    }

  })

}


User.prototype.getAvatar = function () {
  this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}


module.exports = User

// ENDS User.js