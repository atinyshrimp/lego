const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
	const { username, email, password } = req.body;

	try {
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: "User already exists" });
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		const user = new User({
			username,
			email,
			password: hashedPassword,
		});

		await user.save();

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});
		console.log(user);
		console.log(token);

		res.status(201).json({ token, user: { id: user._id, username, email } });
	} catch (error) {
		console.error("Error during registration:", error);
		res.status(500).json({ message: "Server error" });
	}
});

// Login a user
router.post("/login", async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		res.json({ token, user: { id: user._id, username: user.username, email } });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
});

// Get user profile
router.get("/profile", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select("-password");
		res.json(user);
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
});

// Get user favorites
router.get("/favorites", auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select("favorites");
		res.json({ favorites: user.favorites });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
});

// Add a favorite deal
router.post("/favorites", auth, async (req, res) => {
	const { deal } = req.body;

	try {
		const user = await User.findById(req.user.id);
		if (!user.favorites.includes(deal)) {
			user.favorites.push(deal);
			await user.save();
		}
		res.json({ favorites: user.favorites });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
});

// Remove a favorite deal
router.delete("/favorites", auth, async (req, res) => {
	const { deal } = req.body;

	try {
		const user = await User.findById(req.user.id);
		user.favorites = user.favorites.filter((fav) => fav._id !== deal._id);
		await user.save();
		res.json({ favorites: user.favorites });
	} catch (error) {
		res.status(500).json({ message: "Server error" });
	}
});

module.exports = router;
