const { MongoClient } = require("mongodb");
const { insertDeals, insertSales } = require("./node");
const dealabs_scraper = require("../websites/dealabs");
const vinted_scraper = require("../websites/vinted");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();
console.log(process.env);

const MONGODB_URI = `mongodb+srv://joycelapilus:${process.env.MONGODB_CLUSTER_PWD}@fullstack-lego.lyvzb.mongodb.net/?retryWrites=true&w=majority&appName=fullstack-lego`;
const MONGODB_DB_NAME = "lego";
const DEALS_COLLECTION = "deals";
const SALES_COLLECTION = "sales";

async function refreshDatabase() {
	// Ensure all required environment variables are present
	if (!MONGODB_URI || !MONGODB_DB_NAME) {
		console.error("Missing MongoDB configuration");
		process.exit(1);
	}

	const client = new MongoClient(MONGODB_URI);

	try {
		console.log("Starting database refresh...");

		// Connect to MongoDB
		// await client.connect();
		const database = client.db(MONGODB_DB_NAME);

		// Optional: Archive old data before deletion
		const archivedDeals = await database
			.collection(DEALS_COLLECTION)
			.find()
			.toArray();
		const archivedSales = await database
			.collection(SALES_COLLECTION)
			.find()
			.toArray();

		// Create archive collections with timestamp
		const timestamp = new Date().toISOString().replace(/:/g, "-");
		if (archivedDeals.length > 0) {
			await database
				.collection(`deals_archive_${timestamp}`)
				.insertMany(archivedDeals);
		}

		if (archivedSales.length > 0) {
			await database
				.collection(`sales_archive_${timestamp}`)
				.insertMany(archivedSales);
		}

		// Clear existing collections
		await database.collection(DEALS_COLLECTION).deleteMany({});
		await database.collection(SALES_COLLECTION).deleteMany({});

		// Delete previous scraped data
		console.log("Deleting exisiting data...");
		clearPreviousScrapedFiles("./data");

		// Run scraping process
		console.log("Starting scraping...");
		await dealabs_scraper.scrape();
		await vinted_scraper.scrape();

		// Populate the database with new data
		insertDeals(database);
		insertSales(database);

		console.log("Database refresh completed successfully");
	} catch (error) {
		console.error("Database refresh failed:", error);
		process.exit(1);
	} finally {
		await client.close();
	}
}

// Clear existing files in the sales and deals directories before scraping
const fs = require("fs");
const path = require("path");

/**
 * Clears specific files in the provided data folder:
 * Deletes `deals.json` and all JSON files inside the `/sales` directory.
 * @param {string} dataFolderPath - Path to the data folder containing the `deals.json` file and `sales` subfolder.
 */
function clearPreviousScrapedFiles(dataFolderPath) {
	try {
		const dealsFilePath = path.join(dataFolderPath, "deals.json");
		const salesFolderPath = path.join(dataFolderPath, "sales");

		// Delete `deals.json`
		if (fs.existsSync(dealsFilePath)) {
			fs.unlinkSync(dealsFilePath);
			console.log(`Deleted ${dealsFilePath}`);
		} else {
			console.log(`${dealsFilePath} does not exist.`);
		}

		// Delete all JSON files in the `sales` subfolder
		if (
			fs.existsSync(salesFolderPath) &&
			fs.statSync(salesFolderPath).isDirectory()
		) {
			const salesFiles = fs.readdirSync(salesFolderPath);

			salesFiles.forEach((file) => {
				const filePath = path.join(salesFolderPath, file);

				// Check if it's a file and ends with `.json`
				if (fs.statSync(filePath).isFile() && file.endsWith(".json")) {
					fs.unlinkSync(filePath);
					console.log(`Deleted ${filePath}`);
				}
			});

			console.log(`Cleared all JSON files in ${salesFolderPath}`);
		} else {
			console.log(`${salesFolderPath} does not exist or is not a directory.`);
		}
	} catch (error) {
		console.error(`Error clearing previous scraped files:`, error);
		throw error;
	}
}

// Run the refresh immediately when the script is called
refreshDatabase();
