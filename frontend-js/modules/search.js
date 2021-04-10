import axios from "axios"
import DOMPurify from 'dompurify'

export default class Search {
  // ----------------------------------------------------------------------------------------------
  //                                   Constructor 
  // ----------------------------------------------------------------------------------------------
  constructor() {

    // Select DOM elements and store in variables  
    this.injectHTML()
    this.headerSearchIcon = document.querySelector(".header-search-icon")
    this.closeIcon = document.querySelector(".close-live-search")
    this.overlay = document.querySelector(".search-overlay")
    this.inputField = document.querySelector("#live-search-field")
    this.resultsArea = document.querySelector(".live-search-results")
    this.loaderIcon = document.querySelector(".circle-loader")
    this.typingWaitTimer = undefined
    this.previousValue = ""
    this.events()

  } // ENDS constructor() -------------------------------------------------------------------------
  //

  // ----------------------------------------------------------------------------------------------
  //                                   events 
  // ----------------------------------------------------------------------------------------------
  events() {
    // detect keyup in the input field - to detect when typing paused and it's time to search
    this.inputField.addEventListener("keyup", () => this.keyPressHandler())

    // close search overlay when close icon clicked
    this.closeIcon.addEventListener("click", () => this.closeOverlay())

    // open the search overlay when icon clicked
    this.headerSearchIcon.addEventListener("click", (e) => {
      e.preventDefault()
      this.openOverlay()
    })

  } // ENDS events --------------------------------------------------------------------------------
  //

  // ----------------------------------------------------------------------------------------------
  //                                   methods 
  // ----------------------------------------------------------------------------------------------

  //
  // Keyup events handler. Wait for .75 seconds typing pause before making the database request ---
  //
  keyPressHandler() {

    let value = this.inputField.value

    if (value == "") {
      clearTimeout(this.typingWaitTimer)
      this.hideLoaderIcon()
      this.hideResultsArea()
    }

    if (value != "" && value != this.previousValue) {                  // only check alphanumeric keys

      clearTimeout(this.typingWaitTimer)
      this.showLoaderIcon()
      this.hideResultsArea()
      this.typingWaitTimer = setTimeout(() => this.sendRequest(), 750) // After .75 seconds send the request
    }
  } // ENDS keyPressHandler -----------------------------------------------------------------------

  //
  // send searchTerm to MongoDB via POST request to /search ---------------------------------------
  //
  sendRequest() {

    axios.post('/search', { searchTerm: this.inputField.value })

      .then((response) => {
        console.log(response.data)
        this.renderResultsHTML(response.data)
      })
      .catch(() => {
        alert("req failed")
      })
  } // ENDS sendRequest ---------------------------------------------------------------------------


  //
  // Render the JSON results of the MongoDB query as HTML -----------------------------------------
  //
  renderResultsHTML(posts) {

    if (posts.length) {
      this.resultsArea.innerHTML = DOMPurify.sanitize(`
      <div class="list-group shadow-sm">
        <div class="list-group-item active">
          <strong>Search Results</strong> (${posts.length > 1 ? `${posts.length} items found` : 'One item found'}) 
        </div>

      
      ${posts.map((post) => { // If posts found, display each line
        let postDate = new Date(post.createdDate)

        return `
        <a href="/post/${post._id}" class="list-group-item list-group-item-action">
          <img class="avatar-tiny" src="${post.author.avatar}"> 
          <strong>${post.title}</strong>
          <span class="text-muted small">
            by ${post.author.username} on ${postDate.getDate()}/${postDate.getMonth() + 1}/${postDate.getFullYear()}
          </span>
        </a>`}).join('')}

      </div>`)

    } else {
      this.resultsArea.innerHTML = `<p class="alert alert-danger text-center shadow-sm">
      Sorry, we could not find that in the data in the database.
      </p>`
    }
    this.hideLoaderIcon()
    this.showResultsArea()
  } // ENDS renderResultsHTML()

  //
  // Displays the spinner on the search screen ------------------------------------------------------
  //
  showLoaderIcon() {
    this.loaderIcon.classList.add("circle-loader--visible")
  }

  //
  // Hides the spinner on the search screen ------------------------------------------------------
  //
  hideLoaderIcon() {
    this.loaderIcon.classList.remove("circle-loader--visible")
  }

  //
  // un-hide the search results area
  //
  showResultsArea() {
    this.resultsArea.classList.add("live-search-results--visible")
  }

  //
  // Hide the search results HTML
  //

  hideResultsArea() {
    this.resultsArea.classList.remove("live-search-results--visible")
  }

  //
  // Reveal the hidden search form HTML -------------------------------------------------------------
  //
  openOverlay() {
    this.overlay.classList.add("search-overlay--visible")
    setTimeout(() => this.inputField.focus(), 500)
  }

  //
  // Hide the search HTML -------------------------------------------------------------------------
  //

  closeOverlay() {
    this.overlay.classList.remove("search-overlay--visible")
  }

  //
  // inject the search form into the current document ---------------------------------------------
  //
  injectHTML() {
    document.body.insertAdjacentHTML('beforeend', `<div class="search-overlay ">
        <div class="search-overlay-top shadow-sm">
          <div class="container container--narrow">
            <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
            <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
            <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
          </div>
        </div>

        <div class="search-overlay-bottom">
          <div class="container container--narrow py-3">
            <div class="circle-loader"></div>
            <div class="live-search-results "></div>
          </div>
        </div>
      </div>`)
  } // ENDS injectHTML() -------------------------------------------------------------------
  //

} // ENDS class Search
//

//
// ENDS search.js
//