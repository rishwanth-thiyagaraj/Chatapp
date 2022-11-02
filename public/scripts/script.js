const socket = io.connect("http://localhost:9999");
let messageForm = document.getElementById("send-container"),
	messageContainer = document.getElementById("chat-container"),
	messageInput = document.getElementById("message-input"),
	userNameForm = document.getElementById("name-container"),
	userName = document.getElementById("username"),
	chatSection = document.getElementById("chat-section"),
	join = document.getElementById("join-button"),
	userNameSection = document.getElementById("join-container"),
	typingContext = document.getElementById("status"),
	exitButton = document.getElementById("exit-button"),
	namesContainer = document.getElementById("names"),
	Name;

// Navigate to log in layout when user clicks exit.
exitButton.addEventListener("click", () => {
	socket.emit("left");
	messageContainer.replaceChildren();
	chatSection.className = "inactive";
	userNameSection.className = "active";
});

/**
 * Emit event to get list of online users from server.
 * @return {void} Nothing
 */
function getUserList() {
	socket.emit("get-user-list");
}

// Navigate to chat window when user joins the chat after typing name.
join.addEventListener("click", changeUI);
userName.addEventListener("keypress", (event) => {
	if (event.key == "Enter") changeUI();
});

// Indicate that a user has joined a chat.
socket.on("user-connected", (Name) => {
	getUserList();
	appendConnectionInfo(`${Name.Name} joined`);
});

// Indicate that a user has disconnected.
socket.on("user-disconnected", (Name) => {
	typingContext.innerHTML = "";
	if (Name.Name) appendConnectionInfo(`${Name.Name} left`);
	removeUser(Name.Name);
});

// Emit typing event to server when a user types a message.
messageInput.addEventListener("keypress", () => {
	socket.emit("typing", Name);
});

// Clear the input box for next message and emit the sent message to the server.
messageForm.addEventListener("submit", (e) => {
	e.preventDefault();
	const message = messageInput.value;
	appendMessage("You", message, "user-message");
	socket.emit("send-message", message);
	messageInput.value = "";
});

// Update typing status in chat window of all the other users.
socket.on("typing", (name) => {
	typingContext.innerHTML = `${name} is typing...`;
});

// Update messages in chat window when message is sent.
socket.on("chat-message", (data) => {
	typingContext.innerHTML = "";
	appendMessage(data.name, data.message, "message");
});

// Update the online user list whenever a user connects or disconnects.
socket.on("userlist", (nameList) => {
	updateOnlineUserList(nameList.NameList);
});

/**
 * Update who has connected and disconnected from chat.
 * Update the name of the person disconnected to others.
 *
 * @param {string} message The message displayed when user connects or disconnects.
 */
function appendConnectionInfo(message) {
	if (message) {
		let messageElement = document.createElement("div"),
			messageText = document.createElement("div");
		messageText.className = "message-text";
		messageText.innerText = message;
		messageElement.className = "connection";
		messageElement.appendChild(messageText);
		messageContainer.appendChild(messageElement);
		messageContainer.scrollTop = messageContainer.scrollHeight;
	}
}

/**
 * Add messages from all users to the chat window.
 * Add the name of the sender above the message to state who sent the message.
 *
 * @param {string} name The name of the sender of chat message
 * @param {string} message The message sent.
 * @param {string} typeOfMessage States if the message was from or to the user. States the name of class in html to assign specified styling.
 */
function appendMessage(name, message, typeOfMessage) {
	if (message) {
		let messageElement = document.createElement("div"),
			sender = document.createElement("p"),
			messageText = document.createElement("div"),
			timeText = document.createElement("p"),
			time = getCurrentTime();
		sender.className = "sender";
		timeText.className = "time";

		sender.innerText = name;
		timeText.innerText = time;
		messageText.className = "message-text";
		messageText.innerHTML = message;
		messageElement.className = typeOfMessage;
		messageElement.appendChild(sender);
		messageElement.appendChild(messageText);
		messageElement.appendChild(timeText);
		messageContainer.appendChild(messageElement);
		messageContainer.scrollTop = messageContainer.scrollHeight;
	}
}

/**
 * Function to add zero to single digit values
 * The function returns single digit numbers with 0 appended at the beginning
 * addZero(9) returns "09"
 *
 * @param {number} digit a number
 * @return {string} the digit with 0 at the beginning
 */
function addZero(digit) {
	if (digit <= 9) {
		digit = "0" + digit;
	}
	return digit;
}

/**
 * Change the layout of the webpage when a user enters name and joins the chat.
 * Do no changes to the layout when user does not enter any name and tries to join the chat.
 *
 * @return {void} Nothing
 */
function changeUI() {
	if (userName.value == "") {
		console.log("null");
		return;
	} else {
		document.getElementById("current-user").innerHTML = "";
		messageInput.value = "";
		Name = userName.value;
		Name = Name.charAt(0).toUpperCase() + Name.slice(1).toLowerCase();
		appendUserName(Name);
		socket.emit("new-user", Name);
		messageContainer.replaceChildren();
		appendConnectionInfo("You joined");
		getUserList();
		userNameSection.className = "inactive";
		chatSection.className = "active";
	}
}

/**
 * Display the names of users in the chat
 *
 * @param {Object} nameList The list of online users.
 */
function updateOnlineUserList(nameList) {
	namesContainer.replaceChildren();
	for (let i in nameList) {
		let userOnline = document.createElement("p");
		userOnline.className = "user";
		userOnline.id = nameList[i];
		userOnline.innerText = nameList[i];
		namesContainer.appendChild(userOnline);
	}
}

/**
 * Remove the name of user from the list of online users.
 *
 * @param {string} name Name of disconnected user.
 */
function removeUser(name) {
	let userOffline = document.getElementById(name);
	namesContainer.removeChild(userOffline);
}

/**
 * Display the name of the logged in user in their respective screens.
 *
 * @param {string} Name
 */
function appendUserName(Name) {
	let currentUser = document.getElementById("current-user");
	currentUser.innerHTML = Name;
}

/**
 * Get the time at which a message is sent from a user in a particular format.
 *
 * @return {string} The time at which the message was sent.
 */
function getCurrentTime() {
	let date = new Date(),
		time = "",
		month,
		h = date.getHours(),
		state = h > 12 ? "pm" : "am";
	h = h > 12 ? h % 12 : h;
	h = h ? h : 12;
	h = addZero(h);
	month = date.toLocaleString("default", { month: "short" });
	time =
		date.getDate() +
		" " +
		month +
		" " +
		h +
		":" +
		addZero(date.getMinutes()) +
		" " +
		state;
	return time;
}
