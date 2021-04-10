export default class Chat {
  // ----------------------------------------------------------------------------------------------
  //                                   Constructor
  // ----------------------------------------------------------------------------------------------

  constructor() {
    this.openedYet = false
    this.chatWrapper = document.querySelector("#chat-wrapper")
    this.openIcon = document.querySelector(".header-chat-icon")

    this.injectHTML() // load the contents of the chat box into the page
    this.closeIcon = document.querySelector(".chat-title-bar-close") // needs the HTML to be injected first

    this.events() // setup all the event listeners
  }
  // ----------------------------------------------------------------------------------------------
  //                                   Events 
  // ----------------------------------------------------------------------------------------------


  events() {
    // open chat box when icon clicked
    this.openIcon.addEventListener("click", () => this.showChat()) // NB: arrow function does not change "this."
    this.closeIcon.addEventListener("click", () => this.hideChat())

  }







  // ----------------------------------------------------------------------------------------------
  //                                   Methods 
  // ----------------------------------------------------------------------------------------------

  // Open the chat window
  showChat() {
    if (!this.openedYet) {                                 // if first time
      this.openConnection()                                // open connection
    }
    this.openedYet = true                                  // connection established
    this.chatWrapper.classList.add("chat--visible")
  } // ENDS showChat()

  // Open connection
  openConnection() {
    alert("opeing connection")
  }





  // Close the chat window
  hideChat() {
    this.chatWrapper.classList.remove("chat--visible")
  } // ENDS hideChat()


  // insert the HTML for the chat window into the page
  injectHTML() { // start chastWrapper HTML
    this.chatWrapper.innerHTML = `
        <div class="chat-title-bar">Chat <span class="chat-title-bar-close"><i class="fas fa-times-circle"></i></span></div>
        <div id="chat" class="chat-log"></div>
        <form id="chatForm" class="chat-form border-top">
         <input type="text" class="chat-field" id="chatField" placeholder="Type a message…" autocomplete="off">
        </form>
        ` // ENDS chatWrapper HTML

  } // ENDS injectHTML()
  //

  //
} // ENDS class Chat()
//