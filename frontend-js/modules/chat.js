import DOMPurify from 'dompurify'

export default class Chat {
  // ----------------------------------------------------------------------------------------------
  //                                   Constructor
  // ----------------------------------------------------------------------------------------------

  constructor() {
    this.openedYet = false
    this.chatWrapper = document.querySelector("#chat-wrapper")
    this.openIcon = document.querySelector(".header-chat-icon")

    this.injectHTML() // load the contents of the chat box into the page

    this.chatLog = document.querySelector("#chat")
    this.chatField = document.querySelector("#chatField")
    this.chatForm = document.querySelector("#chatForm")
    this.closeIcon = document.querySelector(".chat-title-bar-close") // needs the HTML to be injected first

    this.events() // setup all the event listeners
  }
  // ----------------------------------------------------------------------------------------------
  //                                   Events 
  // ----------------------------------------------------------------------------------------------


  events() {

    this.chatForm.addEventListener("submit", (e) => {                // look for msg type into chat input field
      e.preventDefault()
      this.sendMessageToServer()
    })

    // open chat box when icon clicked
    this.openIcon.addEventListener("click", () => this.showChat())   // NB: arrow function does not change "this."
    this.closeIcon.addEventListener("click", () => this.hideChat())  // close on clicking X in chat form

  }

  // ----------------------------------------------------------------------------------------------
  //                                   Methods 
  // ----------------------------------------------------------------------------------------------

  sendMessageToServer() {
    this.socket.emit('chatMessageFromBrowser', { message: this.chatField.value })
    this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
    <div class="chat-self">
      <div class="chat-message">
        <div class="chat-message-inner">
          ${this.chatField.value}
        </div>
      </div>
      <img class="chat-avatar avatar-tiny" src="${this.avatar}">
    </div>
  `))

    this.chatLog.scrollTop = this.chatLog.scrollHeight

    this.chatField.value = ''
    this.chatField.focus()
  }


  // Open the chat window -------------------------------------------------------------------------
  showChat() {
    if (!this.openedYet) {                                 // if first time
      this.openConnection()                                // open connection
    }
    this.openedYet = true                                  // connection established
    this.chatWrapper.classList.add("chat--visible")
    this.chatField.focus()
  } // ENDS showChat()

  // Open connection ------------------------------------------------------------------------------
  openConnection() {

    this.socket = io()

    this.socket.on('Welcome', data => {
      this.username = data.username
      this.avatar   = data.avatar
    })

    this.socket.on('chatMessageFromServer', (data) => {   // arrow function keeps "this." from changing      

      // alert(data.message)                              // debug +++

      this.displayMessageFromServer(data)

    })

  }

  displayMessageFromServer(data) {

    this.chatLog.insertAdjacentHTML('beforeend', DOMPurify.sanitize(`
    <div class="chat-other">
      <a href="/profile/${data.username}">
        <img class="avatar-tiny" src="${data.avatar}">
      </a>
      <div class="chat-message">
        <div class="chat-message-inner">
          <a href="/profile/${data.username}"><strong>${data.username}: </strong></a>
            ${data.message}
        </div>
      </div>
    </div>
    `))

    this.chatLog.scrollTop = this.chatLog.scrollHeight


  } // ENDS displayMessageFromServer()




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