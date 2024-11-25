async function findBestDiscountDeals(db, minDiscount) {
	const collection = db.collection(DEALS_COLLECTION);

	const bestDiscountDeals = await collection
		.find({ discount: { $gte: minDiscount } })
		.sort({ discount: -1 })
		.toArray();
	console.log(`Deals with Discount above ${minDiscount}%: `);
	return bestDiscountDeals;
}

async function findMostCommentedDeals(db, minComments = 100) {
	const collection = db.collection(DEALS_COLLECTION);

	const mostCommentedDeals = await collection
		.find({ comments: { $gte: minComments } })
		.sort({ comments: -1 })
		.toArray();
	console.log(mostCommentedDeals);
	return mostCommentedDeals;
}

async function findDealsSortedByPrice(db, ascending = false) {
	const collection = db.collection(DEALS_COLLECTION);

	const sortedDeals = await collection
		.find()
		.sort({ price: ascending ? 1 : -1 })
		.toArray();
	console.log(sortedDeals);
	return sortedDeals;
}

async function findDealsSortedByDate(db, ascending = false) {
	const collection = db.collection(DEALS_COLLECTION);

	const sortedDeals = await collection
		.find()
		.sort({ publication: ascending ? 1 : -1 })
		.toArray();
	console.log(sortedDeals);
	return sortedDeals;
}

async function findSalesByLegoID(db, legoId) {
	const collection = db.collection(SALES_COLLECTION);

	const legoSales = await collection.find({ legoId: legoId }).toArray();
	console.log(legoSales);
	return legoSales;
}

async function findRecentSales(db, days = 21) {
	const collection = db.collection(SALES_COLLECTION);

	// Query to find sales that were scraped less than 3 weeks ago, assuming a "scrapedDate" field exists
	const deltaDate = new Date();
	console.log(`Created date: ${deltaDate}`);
	deltaDate.setDate(deltaDate.getDate() - days); // Substract by the number of days

	console.log(`Delayed date: ${deltaDate}`);

	const deltaTimeUnix = Math.floor(deltaDate.getTime() * 1e-3);
	console.log(
		`Converted delayed date: ${deltaTimeUnix} (${typeof deltaTimeUnix})`
	);

	const recentSales = await collection
		.find({ publicationDate: { $gte: deltaTimeUnix } })
		.sort({ publicationDate: -1 })
		.toArray();
	console.log(recentSales);
	return recentSales;
}

async function findHotDeals(db, minTemperature = 100) {
	const collection = db.collection(DEALS_COLLECTION);

	const hotDeals = await collection
		.find({ temperature: { $gte: minTemperature } })
		.sort({ temperature: -1 })
		.toArray();
	console.log(hotDeals);
	return hotDeals;
}

async function findDealsEndingSoon(db, days = 7) {
	const collection = db.collection(DEALS_COLLECTION);

	// Query to find sales that were scraped less than 3 weeks ago, assuming a "scrapedDate" field exists
	const deltaDate = new Date();
	console.log(`Created date: ${deltaDate}`);
	deltaDate.setDate(deltaDate.getDate() + days); // Substract by the number of days

	console.log(`Delayed date: ${deltaDate}`);

	const deltaTimeUnix = Math.floor(deltaDate.getTime() * 1e-3);
	console.log(
		`Converted delayed date: ${deltaTimeUnix} (${typeof deltaTimeUnix})`
	);

	const dealsSoonToExpire = await collection
		.find({ expirationDate: { $lt: deltaTimeUnix } })
		.sort({ expirationDate: -1 })
		.toArray();
	console.log(dealsSoonToExpire);
	return dealsSoonToExpire;
}

module.exports = {
	findBestDiscountDeals,
	findMostCommentedDeals,
	findDealsSortedByPrice,
	findDealsSortedByDate,
	findSalesByLegoID,
	findRecentSales,
	findHotDeals,
	findDealsEndingSoon,
};
