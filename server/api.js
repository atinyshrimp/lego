const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const { calculateLimitAndOffset, paginate } = require("paginate-info");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

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

connectToDatabase();

/** ================== Endpoints ================== */
app.get("/", (_, res) => {
	res.send({ ack: true });
});

/** Deals */
// Search deals
app.get("/v1/deals/search", async (req, res) => {
	try {
		// Extract query parameters
		const {
			page = 1,
			limit = 12, // Default to 12
			legoId, // Lego set ID filter
			price, // Price filter
			date, // Date filter
			sortBy, // Sorting filter
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

		// Add Lego set ID filter if specified
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

		// Add sorting filter if specified
		let sortingFilter; // Sort by price in ascending order by default

		// Handle special filters
		if (filterBy) {
			let splittedFilter = filterBy.split("-");
			const minThreshold =
				splittedFilter.length === 3 ? Number(splittedFilter[2]) : 0;

			splittedFilter = `${splittedFilter[0]}-${splittedFilter[1]}`;
			switch (splittedFilter) {
				case "best-discount":
					filter.discount = { $exists: true, $gte: minThreshold };
					sortingFilter = { discount: -1 }; // Sort deals by "discount" in descending order
					break;

				case "most-commented":
					filter.comments = { $exists: true, $gte: minThreshold };
					sortingFilter = { comments: -1 }; // Sort deals by "comments" in descending order
					break;

				case "hot-deals":
					filter.temperature = { $exists: true, $gte: minThreshold };
					sortingFilter = { temperature: -1 }; // Sort deals by "temperature" in descending order
					break;

				default:
					console.warn(`Unknown filterBy value: ${splittedFilter}`);
					break;
			}
		}

		if (sortingFilter === undefined) {
			sortingFilter = { price: 1 }; // Sort by price in ascending order by default (if applicable)
			if (sortBy) {
				sortingFilter = {};

				const fieldToSort = sortBy.split("-")[0];
				const sortingOrder = sortBy.split("-")[1] === "desc" ? -1 : 1;

				switch (fieldToSort) {
					case "price":
						sortingFilter = { price: sortingOrder };
						break;
					case "date":
						sortingFilter = { publication: sortingOrder };
						break;
					default:
						res.status(501).json({
							error: `Non valid parameter for sortBy field: ${sortBy}`,
						});
				}
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
			.sort(sortingFilter)
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
			results: deals,
			meta: pagination,
		});
	} catch (error) {
		console.error("Error fetching the deals: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Get unique Lego Set IDs
app.get("/v1/deals/unique", async (_, res) => {
	try {
		// Aggregation to get unique Lego Set IDs from database
		const agg = [
			{
				$group: {
					_id: null,
					results: {
						$addToSet: "$legoId",
					},
				},
			},
			{
				$project: {
					_id: 0,
					results: {
						$sortArray: {
							input: "$results",
							sortBy: 1,
						},
					},
				},
			},
		];

		const cursor = deals_collection.aggregate(agg);
		const uniqueIDs = await cursor.toArray();
		res.status(200).json(uniqueIDs[0]);
	} catch (error) {
		console.error("Error fetching the deal: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Get deals by ID
app.get("/v1/deals/:id", async (req, res) => {
	try {
		const id = req.params.id;
		const deal = await deals_collection.find({ _id: id }).toArray();
		res.status(200).json(deal[0]);
	} catch (error) {
		console.error("Error fetching the deal: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

/** Sales */
// Search deals
app.get("/v1/sales/search", async (req, res) => {
	try {
		// Extract query parameters
		const {
			page = 1,
			limit = 12, // Default to 12
			legoSetId, // Lego set ID filter
		} = req.query;

		// Initialize the query object
		const filter = {};

		if (legoSetId) {
			filter.legoId = legoSetId;
		}

		// Calculate limit and offset for pagination
		const { limit: pageLimit, offset } = calculateLimitAndOffset(
			Number(page),
			Number(limit)
		);

		// Fetch results with sorting and limiting
		const sales = await sales_collection
			.find(filter) // Apply the filter
			.sort({ price: 1 }) // Sort by price in ascending order
			.skip(offset)
			.limit(pageLimit) // Limit the number of results
			.toArray();

		// Get total count for pagination metadata
		const totalResults = await sales_collection.countDocuments(filter);

		// Generate pagination metadata
		const pagination = paginate(
			Number(page),
			totalResults,
			sales,
			Number(limit)
		);

		res.status(200).json({
			success: true,
			results: sales,
			meta: pagination,
		});
	} catch (error) {
		console.error("Error fetching the sales: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
});
