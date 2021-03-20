
const usersCollection = require('../db').collection('users') // pickup the users collection handle

const validator = require('validator')

let User = function(data) {
  this.data = data
  this.errors = []
}

User.prototype.cleanUp = function() {
  if(typeof(this.data.username) != "string") {this.data.username = ""}
  if(typeof(this.data.email) != "string") {this.data.email = ""}
  if(typeof(this.data.password) != "string") {this.data.password = ""}

  // get rid of doodgy properties
  this.data = {
    username: this.data.username.trim().toLowerCase(),
    email: this.data.email.trim().toLowerCase(),
    password: this.data.password
  }
}

User.prototype.validate = function() {
  if(this.data.username == "") {this.errors.push("A username is required.")}
  if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)) {this.errors.push("A username can only contain a-z, A-Z, 0-9.")}
  if(this.data.email == "") {this.errors.push("An email is required.")}
  if(!validator.isEmail(this.data.email)) {this.errors.push("A valid email format is required.")}
  if(this.data.password == "") {this.errors.push("A password is required.")}
  if(this.data.password.length > 0 && this.data.password.length < 12) {this.errors.push("A password must be 12 characters long.")}
  if(this.data.password.length > 100) {this.errors.push("A password cannot exceed 100 characters long.")}
  if(this.data.username.length > 0 && this.data.username.length < 3) {this.errors.push("A username must be 3 characters long.")}
  if(this.data.username.length > 30) {this.errors.push("A username cannot exceed 30 characters long.")}
}


User.prototype.register = function() {

  // validate data
  this.cleanUp()
  this.validate()

  // only if there are no validation errors, save the data
  if (!this.errors.length) {
    usersCollection.insertOne(this.data)
  }


}


module.exports = User