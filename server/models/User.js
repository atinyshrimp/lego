const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	username: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
	},
	favorites: {
		type: Array, // Array of objects
		default: [],
	},
});

module.exports = mongoose.model("User", UserSchema);
