const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const { calculateLimitAndOffset, paginate } = require("paginate-info");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

let db, deals_collection, sales_collection;
function connectToDatabase() {
	db = client.db("lego");
	deals_collection = db.collection("deals");
	sales_collection = db.collection("sales");

	console.log(`Connected to "${db.namespace}" on MongoDB Atlas`);
}

process.on("SIGINT", async () => {
	console.log("Closing MongoDB connection");
	await client.close();
	process.exit(0);
});

/** ================== Endpoints ================== */
app.get("/", (_, res) => {
	res.send({ ack: true });
});

/** Deals */
// Search deals
app.get("/deals/search", async (req, res) => {
	try {
		// Extract query parameters
		const {
			page = 1,
			limit = 12, // Default to 12
			legoId, // Lego set ID filter
			price, // Price filter
			date, // Date filter
			filterBy, // Special filter
		} = req.query;

		// Initialize the query object
		const filter = {};

		// Add price filter if specified
		if (price) {
			if (price.includes("-")) {
				const [minPrice, maxPrice] = price.split("-").map(Number); // e.g., "10-50"
				filter.price = { $gte: minPrice, $lte: maxPrice };
			} else {
				filter.price = { $gte: Number(price) };
			}
		}

		if (legoId) {
			filter.legoId = legoId;
		}

		// Add date filter if specified
		if (date) {
			// Range of dates
			if (date.includes(",")) {
				const [startDate, endDate] = date
					.split(",")
					.map((d) => new Date(d).getTime() * 1e-3); // e.g., "2023-01-01,2023-12-31"
				filter.publication = { $gte: startDate, $lte: endDate };
			} else {
				// If only one date is given
				filter.publication = {
					$gte: new Date(date).getTime() * 1e-3,
				};
			}
		}

		// Handle special filters
		if (filterBy) {
			switch (filterBy) {
				case "best-discount":
					filter.discount = { $exists: true, $gte: 0 }; // Assuming a "discount" field exists
					break;
				case "most-commented":
					filter.comments = { $exists: true, $gte: 0 }; // Assuming a "commentsCount" field exists
					break;
				default:
					console.warn(`Unknown filterBy value: ${filterBy}`);
			}
		}

		// Calculate limit and offset for pagination
		const { limit: pageLimit, offset } = calculateLimitAndOffset(
			Number(page),
			Number(limit)
		);

		// Fetch results with sorting and limiting
		const deals = await deals_collection
			.find(filter) // Apply the filter
			.sort({ price: 1 }) // Sort by price in ascending order
			.skip(offset) // Skip documents for pagination
			.limit(pageLimit) // Limit the number of results
			.toArray();

		// Get total count for pagination metadata
		const totalResults = await deals_collection.countDocuments(filter);

		// Generate pagination metadata
		const pagination = paginate(
			Number(page),
			totalResults,
			deals,
			Number(limit)
		);

		res.status(200).json({
			success: true,
			...pagination,
			results: deals,
		});
	} catch (error) {
		console.error("Error fetching the deals: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Get deals by ID
app.get("/deals/:id", async (req, res) => {
	try {
		const id = req.params.id;
		const deal = await deals_collection.find({ _id: id }).toArray();
		res.status(200).json(deal);
	} catch (error) {
		console.error("Error fetching the deal: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

/** Sales */
// Search deals
app.get("/sales/search", async (req, res) => {
	try {
		// Extract query parameters
		const {
			limit = 12, // Default to 12
			legoSetId, // Lego set ID filter
		} = req.query;

		// Initialize the query object
		const filter = {};

		if (legoSetId) {
			filter.legoId = legoSetId;
		}

		// Fetch results with sorting and limiting
		const sales = await sales_collection
			.find(filter) // Apply the filter
			.sort({ price: 1 }) // Sort by price in ascending order
			.limit(Number(limit)) // Limit the number of results
			.toArray();

		res.status(200).json({
			limit: Number(limit),
			total: sales.length,
			results: sales,
		});
	} catch (error) {
		console.error("Error fetching the sales: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

app.listen(PORT, function () {
	connectToDatabase();
	// console.log(`📡 Running on http://localhost:${PORT}/`);
});
