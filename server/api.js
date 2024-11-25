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
} = require("./mongodb/queries");
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
async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db(process.env.MONGODB_DB);
        deals_collection = db.collection(process.env.MONGODB_DEALS_COLLECTION);
        sales_collection = db.collection(process.env.MONGODB_SALES_COLLECTION);

        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectToDatabase();

process.on("SIGINT", async () => {
    console.log("Closing MongoDB connection");
    await client.close();
    process.exit(0);
});

/** Endpoints */
app.get("/", (_, res) => {
    res.send({ ack: true });
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

app.listen(PORT);

console.log(`📡 Running on http://localhost:${PORT}/`);
