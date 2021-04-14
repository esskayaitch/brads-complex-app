
import axios from "axios"

export default class RegistrationForm {

  // ----------------------------------------------------------------------------------------------
  //                                   Constructor
  // ----------------------------------------------------------------------------------------------

  constructor() {

    this._csrf = document.querySelector('[name="_csrf"]').value
    this.form = document.querySelector("#registration-form")
    this.allFields = document.querySelectorAll("#registration-form .form-control")
    this.insertValidationElements()
    this.username = document.querySelector("#username-register")
    this.email = document.querySelector("#email-register")
    this.password = document.querySelector("#password-register")
    this.username.previousValue = ""
    this.email.previousValue = ""
    this.password.previousValue = ""
    this.username.isUnique = false
    this.email.isUnique = false
    this.events()


  } // ENDS constructor()
  //

  // ----------------------------------------------------------------------------------------------
  //                                   Events 
  // ----------------------------------------------------------------------------------------------

  events() {

    this.form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.formSubmitHandler()
    })

    this.username.addEventListener("keyup", () => {
      this.isDifferent(this.username, this.usernameHandler)
    })

    this.email.addEventListener("keyup", () => {
      this.isDifferent(this.email, this.emailHandler)
    })

    this.password.addEventListener("keyup", () => {
      this.isDifferent(this.password, this.passwordHandler)
    })


    this.username.addEventListener("blur", () => {
      this.isDifferent(this.username, this.usernameHandler)
    })

    this.email.addEventListener("blur", () => {
      this.isDifferent(this.email, this.emailHandler)
    })

    this.password.addEventListener("blur", () => {
      this.isDifferent(this.password, this.passwordHandler)
    })


  } // ENDS events() 
  //

  // ----------------------------------------------------------------------------------------------
  //                                   Methods 
  // ----------------------------------------------------------------------------------------------

  //
  // Called when the registration form is submitted -----------------------------------------------
  //
  formSubmitHandler() {

    this.usernameImmediately()
    this.usernameAfterDelay()
    this.emailAfterDelay()
    this.passwordImmediately()
    this.passwordAfterDelay()

    // console.log("this.username.isUnique=" + this.username.isUnique)         // debug
    // console.log("!this.username.errors=" + !this.username.errors)           // debug
    // console.log("this.email.isUnique=" + this.email.isUnique)               // debug
    // console.log("!this.email.errors=" + !this.email.errors)                 // debug
    // console.log("!this.password.errors=" + !this.password.errors)           // debug


    if (
      this.username.isUnique &&
      !this.username.errors &&
      this.email.isUnique &&
      !this.email.errors &&
      !this.password.errors
    ) {
      this.form.submit()
    } else {
      alert("error detected")
    }
    //
  } // ENDS formSubmitHandler()
  //

  //
  // See if the contents of the input field has changed after keeup -------------------------------
  //
  isDifferent(el, handler) {
    if (el.previousValue != el.value) {
      // handler()                               // this syntax would point "this" to the global window object
      handler.call(this)                         // Used to set "this" to this, the form object
    }
    el.previousValue = el.value
  } // ENDS inDifferent()
  //

  // insert hidden HTML into the three registration fields ----------------------------------------
  //
  insertValidationElements() {
    this.allFields.forEach(function (el) {
      el.insertAdjacentHTML('afterend', '<div class="alert alert-danger small liveValidateMessage"></div>')
    })
  } // ENDS insertValidationElements()
  //

  //
  // Called when the contents of the username field was changed -----------------------------------
  //
  usernameHandler() {
    this.username.errors = false
    // console.log("In usernameHandler +++++++++++++++++++++++++++++++++++")   // debug

    this.usernameImmediately()                                                 // Do these checks now
    clearTimeout(this.username.timer)                                          // Clear the timer
    this.username.timer = setTimeout(() => this.usernameAfterDelay(), 1200)    // Do these checks after timeout

  } // ENDS usernameHandler()
  //

  //
  // Called when the contents of the password field was changed -----------------------------------
  //
  passwordHandler() {
    this.password.errors = false
    // console.log("In passwordHandler +++++++++++++++++++++++++++++++++++")   // debug
    this.passwordImmediately()                                                 // Do these checks now
    clearTimeout(this.password.timer)                                          // Clear the timer
    this.password.timer = setTimeout(() => this.passwordAfterDelay(), 1200)    // Do these checks after timeout

  } // ENDS passwordHandler()
  //

  //
  // Called when the contents of the username field was changed -----------------------------------
  //
  emailHandler() {
    this.email.errors = false
    clearTimeout(this.email.timer)                                      // Clear the timer
    this.email.timer = setTimeout(() => this.emailAfterDelay(), 800)    // Do these checks after timeout

  } // ENDS emailHandler()
  //

  //
  // Input checks to be run per keystroke ---------------------------------------------------------
  //
  usernameImmediately() {
    if (this.username.value != "" && !/^()[a-zA_Z0-9]+$/.test(this.username.value)) {
      this.showValidationError(this.username, "Username can only contain letters and numbers.")
    }
    if (this.username.value.length > 30) {
      this.showValidationError(this.username, "Username can only be 30 character long.")
    }
    if (!this.username.errors) {
      this.hideValidationError(this.username)
    }
    //
  } // ENDS usernameImmediately()
  //

  //
  // Input checks to be run after delay -----------------------------------------------------------
  //
  usernameAfterDelay() {
    if (this.username.value.length < 3) {
      this.showValidationError(this.username, "Username must be at least 3 characters long.")
    }
    if (!this.username.errors) {
      axios.post('/doesUsernameExist', { _csrf: this._csrf, username: this.username.value }) // send csrf token
        .then((response) => {
          if (response.data) {
            this.showValidationError(this.username, "That username is already being used.")
            this.username.isUnique = false
          } else {
            this.username.isUnique = true
          }
        })
        .catch(() => {
          console.log("MongoDB did not respond. Please try again later. (username)")
        })
    }
    //
  } // ENDS usernameAfterDelay()
  //

  //
  // Password validations to be run per keystroke -------------------------------------------------
  //
  passwordImmediately() {
    if (this.password.value.length > 50) {
      this.showValidationError(this.password, "Password cannot be longer than 50 characters.")
    }
    if (!this.password.errors) {
      this.hideValidationError(this.password)
    }
  } // ENDS passwordImmediately()
  //

  //
  // Password validations to be run afetr delay ---------------------------------------------------
  //

  passwordAfterDelay() {
    if (this.password.value.length < 12) {
      this.showValidationError(this.password, "Password must be at least 12 characters.")
    }
  } // ENDS passwordAfterDelay()
  //

  //
  // Email vlidations to be run after delay -------------------------------------------------------
  //
  emailAfterDelay() {
    if (!/^\S+@\S+$/.test(this.email.value)) {
      this.showValidationError(this.email, "That is not a valid email format.")
    }
    if (!this.email.errors) {
      axios.post('/doesEmailExist', { _csrf: this._csrf, email: this.email.value })
        .then((response) => {

          if (response.data) {
            this.email.isUnique = false
            this.showValidationError(this.email, "That email is already being used.")
          } else {
            this.email.isUnique = true
            this.hideValidationError(this.email)
          }
        })
        .catch(() => {
          console.log("MongoDB did not respond. Please try again later. (email)")
        })
    }
    //
  } // ENDS emailAfterDelay()
  //

  //
  // Display error messages for all three fields---------------------------------------------------
  //
  showValidationError(el, message) {
    el.nextElementSibling.innerHTML = message
    el.nextElementSibling.classList.add("liveValidateMessage--visible")        // Show error message
    el.errors = true
    //
  } // ENDS showValidationError()
  //

  //
  // Remove the error message -----------------------------------------------------------------------
  //
  hideValidationError(el) {
    el.nextElementSibling.classList.remove("liveValidateMessage--visible")     // Hide error message
    //
  } // ENDS hideValidationError

  //
}  // ENDS registrationForm.js
//