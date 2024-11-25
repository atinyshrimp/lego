const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const { MongoClient, ServerApiVersion } = require("mongodb");
const {
	findBestDiscountDeals,
	findMostCommentedDeals,
	findDealsSortedByPrice,
	findDealsSortedByDate,
	findSalesByLegoSetId,
	findRecentSales,
} = require("./mongodb/queries"); // Adjust the path as needed
require("dotenv").config();

const PORT = 8092;

const app = express();

module.exports = app;

app.use(require("body-parser").json());
app.use(cors());
app.use(helmet());

app.options("*", cors());

/** Set Up MongoDB Connection */
const uri = `mongodb+srv://joycelapilus:${process.env.MONGODB_CLUSTER_PWD}@fullstack-lego.lyvzb.mongodb.net/?retryWrites=true&w=majority&appName=fullstack-lego`;
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});

let db;
async function connectToDatabase() {
	try {
		await client.connect();
		db = client.db(process.env.MONGODB_DB);
		console.log("Connected to MongoDB");
	} catch (error) {
		console.error("Error connecting to MongoDB:", error);
	}
}

connectToDatabase();

/** Endpoints */
app.get("/", (req, res) => {
	res.send({ ack: true });
});

// Get deals by ID
app.get("/deals/:id", async (req, res) => {
	try {
		const id = req.params.id;
		const deal = await db.collection("deals").find({ _id: id }).toArray();
		res.status(200).json(deal);
	} catch (error) {
		console.error("Error fetching the deal: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.listen(PORT);

console.log(`📡 Running on port ${PORT}`);
