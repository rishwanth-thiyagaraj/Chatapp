// Import necessary packages.
const socket = require("socket.io");
(express = require("express")),
	(port = process.env.port || 9999),
	(app = express()),
	(bp = require("body-parser")),
	(server = app.listen(port, () => {
		console.log(`Listening at ${port}`);
	}));
let users = {};

// Transform JSON input into Javascript-accessible variables
app.use(bp.json());

/* Transform URL encoded request into Javascript-accessible variables under request.body
 * body-parser's extended property is set to false to make sure it only accepts strings and arrays.
 */
app.use(bp.urlencoded({ extended: false }));

// Render HTML file when "/index.html" is requested in URL.
app.use("/index(.html)?", express.static("public"));

// Render static files such as images,CSS and JS from "files" folder.
app.use(express.static("public"));

// Load HTML file when server is loaded without any request.
app.get("/", (__, response) => {
	response.sendFile("index.html");
});
const io = socket(server);

// Tasks to be done and do when a user connects.
io.on("connection", (socket) => {
	// Send event to all users when a new user connects.
	socket.on("new-user", (Name) => {
		users[socket.id] = Name;
		socket.broadcast.emit("user-connected", {
			Name: users[socket.id],
		});
	});

	// Send the list of users connected to the server with an event.
	socket.on("get-user-list", () => {
		socket.emit("userlist", { NameList: users });
	});

	// Send event to inform all users when a user is typing a message.
	socket.on("typing", () => {
		socket.broadcast.emit("typing", users[socket.id]);
	});

	// Send messages to all users that is sent by one user.
	socket.on("send-message", (message) => {
		socket.broadcast.emit("chat-message", {
			message: message,
			name: users[socket.id],
		});
	});

	// Send event to inform all users when a user disconnects.
	socket.on("disconnect", updateDisconnection);

	// Send event to inform all users when a user leaves.
	socket.on("left", updateDisconnection);

	/**
	 * Send to all users except the user that disconnected, that a user has left the chat box.
	 * @return {void} Nothing
	 */
	function updateDisconnection() {
		socket.broadcast.emit("user-disconnected", {
			Name: users[socket.id],
		});
		delete users[socket.id];
	}
});
