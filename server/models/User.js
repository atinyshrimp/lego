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
		type: [String], // Array of deal IDs
		default: [],
	},
});

module.exports = mongoose.model("User", UserSchema);
