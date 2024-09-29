// Invoking strict mode
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
"use strict";

console.log("🚀 This is it.");

const MY_FAVORITE_DEALERS = [
  {
    name: "Dealabs",
    url: "https://www.dealabs.com/groupe/lego",
  },
  {
    name: "Avenue de la brique",
    url: "https://www.avenuedelabrique.com/promotions-et-bons-plans-lego",
  },
];

console.table(MY_FAVORITE_DEALERS);
console.log(MY_FAVORITE_DEALERS[0]);

/**
 * 🌱
 * Let's go with a very very simple first todo
 * Keep pushing
 * 🌱
 */

// 🎯 TODO 1: The highest reduction
// 0. I have 2 favorite lego sets shopping communities stored in MY_FAVORITE_DEALERS variable
// 1. Create a new variable and assign it the link of the lego set with the highest reduction I can find on these 2 websites
// 2. Log the variable
var highestReduction =
  "https://www.avenuedelabrique.com/lego-movie/70824-la-reine-watevra-wa-nabi/p5202"; // avenuedelabrique.com w/ -60%
console.log(highestReduction);

/**
 * 🧱
 * Easy 😁?
 * Now we manipulate the variable `deals`
 * `deals` is a list of deals from several shopping communities
 * The variable is loaded by the file `data.js`
 * 🧱
 */

// 🎯 TODO 2: Number of deals
// 1. Create a variable and assign it the number of deals
// 2. Log the variable

var nbDeals = deals.length;
console.log(`number of deals: ${nbDeals}`);

// 🎯 TODO 3: Website name
// 1. Create a variable and assign it the list of shopping community name only
// 2. Log the variable
// 3. Log how many shopping communities we have

var uniqueCommunities = Array.from(
  new Set(deals.map((deal) => deal.community)) // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map
);
console.log(uniqueCommunities);
console.log(`number of communities: ${uniqueCommunities.length}`);

// 🎯 TODO 4: Sort by price
// 1. Create a function to sort the deals by price
// 2. Create a variable and assign it the list of sets by price from lowest to highest
// 3. Log the variable

/** Sorts an array of deals by their `price` property.
 *
 * @param {Array} deals - The list of deal objects to be sorted.
 * @param {boolean} ascending - Whether to sort in ascending order. Defaults to `true`.
 * @returns {Array} A new array of deals sorted by price.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort|Reference} for sorting functionality.
 */
function sortDealsByPrice(deals, ascending = true) {
  try {
    return deals.sort((a, b) =>
      ascending ? a.price - b.price : b.price - a.price
    );
  } catch (e) {
    console.log(e);
  }
}

var dealsAscendingPrices = sortDealsByPrice(deals);
console.log("Deals sorted by ascending price:");
console.table(dealsAscendingPrices);

// 🎯 TODO 5: Sort by date
// 1. Create a function to sort the deals by date
// 2. Create a variable and assign it the list of deals by date from recent to old
// 3. Log the variable

/** Sorts an array of deals by their `published` date.
 *
 * @param {Array} deals - The list of deal objects to be sorted.
 * @param {boolean} chronological - Whether to sort in chronological order (oldest to most recent). Defaults to `false` (most recent to oldest).
 * @returns {Array} A new array of deals sorted by the `published` date.
 *
 * @see {@link https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Date/parse|Reference} for using dates.
 */
function sortDealsByDate(deals, chronological = false) {
  try {
    return deals.sort(
      (a, b) =>
        chronological
          ? Date.parse(a.published) - Date.parse(b.published) // oldest to most recent
          : Date.parse(b.published) - Date.parse(a.published) // most recent to oldest
    );
  } catch (e) {
    console.log(e);
  }
}

var dealsDescendingDates = sortDealsByDate(deals);
console.table(dealsDescendingDates);

// 🎯 TODO 6: Filter a specific percentage discount range
// 1. Filter the list of deals between 50% and 75%
// 2. Log the list

/** Filters the deals based on a discount percentage range.
 *
 * @param {number} [rangeBeg = 0] - The beginning of the discount range (inclusive). Must be between 0 and 100. Defaults to 0.
 * @param {number} [rangeEnd = 100] - The end of the discount range (inclusive). Must be between 0 and 100. Defaults to 100.
 * @returns {Array} A new array of deals that have a discount within the specified range.
 * @throws {RangeError} If `rangeBeg` is greater than or equal to `rangeEnd`.
 * @throws {RangeError} If `rangeBeg` or `rangeEnd` is outside the allowed range (0 to 100).
 */
function filterDeals(rangeBeg = 0, rangeEnd = 100) {
  try {
    if (rangeBeg >= 0 && rangeEnd <= 100) {
      if (rangeBeg < rangeEnd) {
        return deals.filter(
          (deal) => deal.discount >= rangeBeg && deal.discount <= rangeEnd
        );
      } else {
        throw new RangeError("rangeBeg has to be lesser than rangeEnd");
      }
    } else {
      throw new RangeError("input discount has to be between 0 and 100");
    }
  } catch (e) {
    console.log(e);
  }
}

var filteredDeals = filterDeals(50, 75);
console.table(filteredDeals);

// 🎯 TODO 7: Average percentage discount
// 1. Determine the average percentage discount of the deals
// 2. Log the average

/** Calculates the average discount percentage from a list of deals.
 *
 * @param {Array} deals - The list of deal objects to process.
 * @returns {number} The average discount percentage, rounded to two decimal places.
 * @throws {Error} If any error occurs during calculation.
 */
function getDiscountAverage(deals) {
  try {
    // Filter out deals that have a valid discount and calculate the sum of their discounts
    let totalDiscount = deals
      .filter((deal) => deal.discount !== null) // Remove deals without a discount
      .reduce((sum, deal) => sum + deal.discount, 0); // Sum all the discounts

    // Count the number of deals that have a valid discount
    let countDiscountedDeals = deals.filter(
      (deal) => deal.discount !== null
    ).length;

    // Calculate and return the average discount
    let averageDiscount = totalDiscount / countDiscountedDeals;
    return Number(averageDiscount.toFixed(2)); // Round the average to the 100th
  } catch (e) {
    console.log(e);
  }
}

// Log the average discount
var averageDiscount = getDiscountAverage(deals);
console.log(`Average percentage discount: ${averageDiscount}%`);

/**
 * 🏎
 * We are almost done with the `deals` variable
 * Keep pushing
 * 🏎
 */

// 🎯 TODO 8: Deals by community
// 1. Create an object called `communities` to manipulate deals by community name
// The key is the community name
// The value is the array of deals for this specific community
//
// Example:
// const communities = {
//   'community-name-1': [{...}, {...}, ..., {...}],
//   'community-name-2': [{...}, {...}, ..., {...}],
//   ....
//   'community-name-n': [{...}, {...}, ..., {...}],
// };
//
// 2. Log the variable
// 3. Log the number of deals by community

const communities = {};

// Add the unique communities stored earlier in `communities`
uniqueCommunities.forEach((community) => (communities[community] = []));

// Push the current deal into the array for this community
deals.forEach((deal) => communities[deal.community].push(deal));

// Log the communities object
console.log(communities);

// Log the number of deals for each community
Object.keys(communities).forEach((community) => {
  console.log(`${community}: ${communities[community].length} deals`);
});

// 🎯 TODO 9: Sort by price for each community
// 1. For each community, sort the deals by discount price, from highest to lowest
// 2. Log the sort

// Copy the `communities` variable
var sortedCommunities = communities;

// Use the created function to sort each community
Object.keys(sortedCommunities).forEach((community) => {
  sortedCommunities[community] = sortDealsByPrice(
    sortedCommunities[community],
    false
  );
});

// Log the sorted communities
console.log(sortedCommunities);

// 🎯 TODO 10: Sort by date for each community
// 1. For each set, sort the deals by date, from old to recent
// 2. Log the sort

// Copy the `communities` constant
var sortedCommunitiesPerDate = communities;

// Sort the communities
Object.keys(sortedCommunitiesPerDate).forEach((community) => {
  sortedCommunitiesPerDate[community] = sortDealsByDate(
    sortedCommunitiesPerDate[community],
    true
  );
});

// Log the sort
console.log(sortedCommunitiesPerDate);

/**
 * 🧥
 * Cool for your effort.
 * Now we manipulate the variable `VINTED`
 * `VINTED` is the listing of current items from https://www.vinted.fr/catalog?search_text=43230&time=1727075774&status_ids[]=6&status_ids[]=1&brand_ids[]=89162&page=1
 * The target set is 43230 (Walt Disney Tribute Camera)
 * 🧥
 */

const VINTED = [
  {
    title: "Notice Lego « Caméra Disney »",
    link: "https://www.vinted.fr/items/3605077693-notice-lego-camera-disney",
    price: 5,
    released: "2024-09-18",
    uuid: "aee175f6-bce6-5f7d-9b99-f6ec96671c4a",
  },
  {
    title: "LEGO 43230 Disney 100 Camera Tribute",
    link: "https://www.vinted.fr/items/4964644230-lego-43230-disney-100-camera-tribute",
    price: 60,
    released: "2024-09-17",
    uuid: "d2462dbb-ba6e-5437-862c-12b4518cfc7b",
  },
  {
    title: "Lego 43230 Cámara Disney 100",
    link: "https://www.vinted.fr/items/5061282955-lego-43230-camara-disney-100",
    price: 48,
    released: "2024-09-18",
    uuid: "713819bc-b0d4-58db-bb44-3bdc89a3ffde",
  },
  {
    title: "[NEUF] Lego Disney 43230 La Caméra Hommage à Walt Disney",
    link: "https://www.vinted.fr/items/4263906992-neuf-lego-disney-43230-la-camera-hommage-a-walt-disney",
    price: 80,
    released: "2024-09-16",
    uuid: "43aa847d-fa49-5f09-b0e5-fe5692916bd8",
  },
  {
    title: "Lego 43230 caméra Disney 100 ans",
    link: "https://www.vinted.fr/items/4198605861-lego-43230-camera-disney-100-ans",
    price: 74,
    released: "2024-09-17",
    uuid: "5089f876-98a1-50a8-a85d-e3d29db1ae5c",
  },
  {
    title: "Lego Camera Disney 43230 NEUF et scellé",
    link: "https://www.vinted.fr/items/4778200935-lego-camera-disney-43230-neuf-et-scelle",
    price: 79,
    released: "2024-09-18",
    uuid: "9084115a-ea2a-5b37-8521-a4112053a2cc",
  },
  {
    title: "LEGO Disney - Camera - 43230",
    link: "https://www.vinted.fr/items/5017548194-lego-disney-camera-43230",
    price: 80,
    released: "2024-09-16",
    uuid: "d0f5fd54-8661-5ea5-8fca-a9817bf1885d",
  },
  {
    title: "Lego Disney 43230",
    link: "https://www.vinted.fr/items/4508766073-lego-disney-43230",
    price: 79,
    released: "2024-09-22",
    uuid: "de2c5905-7bc5-5061-914a-99809f698141",
  },
  {
    title: "43230 Homenaje a Walt Disney New LEGO",
    link: "https://www.vinted.fr/items/5060103695-43230-homenaje-a-walt-disney-new-lego",
    price: 76,
    released: "2024-09-21",
    uuid: "ac474b4a-6fe0-5fed-8317-b057277ddf81",
  },
  {
    title: "Figurine Lego disney mickey mouse",
    link: "https://www.vinted.fr/items/4538856243-figurine-lego-disney-mickey-mouse",
    price: 8,
    released: "2024-09-23",
    uuid: "f965e5d2-d3a4-597c-9fe4-90d501b436cf",
  },
  {
    title: "Lego cinepresa omaggio a walt disney 43230",
    link: "https://www.vinted.fr/items/4023316953-lego-cinepresa-omaggio-a-walt-disney-43230",
    price: 85,
    released: "2024-09-16",
    uuid: "b03ce63e-e69e-5335-847a-0032f18ac9d2",
  },
  {
    title: "Gioco Lego 43230 Disney 100",
    link: "https://www.vinted.fr/items/4896272400-gioco-lego-43230-disney-100",
    price: 89,
    released: "2024-09-22",
    uuid: "b1d6748f-0b09-54c4-801b-be63bbdd897a",
  },
  {
    title: "LEGO - Disney - La caméra Hommage à Walt Disney",
    link: "https://www.vinted.fr/items/4167039593-lego-disney-la-camera-hommage-a-walt-disney",
    price: 99,
    released: "2024-09-20",
    uuid: "22f38d93-d41b-57ec-b418-626b8dc98859",
  },
  {
    title: "Minifigurine lego disney minnie mouse",
    link: "https://www.vinted.fr/items/4538862515-minifigurine-lego-disney-minnie-mouse",
    price: 10,
    released: "2024-09-19",
    uuid: "ef4efcbf-ed3f-5801-8d50-93878ede9618",
  },
  {
    title: "Lego 43230",
    link: "https://www.vinted.fr/items/4756756098-lego-43230",
    price: 100,
    released: "2024-09-15",
    uuid: "2c915f88-9d39-5a39-9a11-bf2d2295a59c",
  },
  {
    title: "Lego 43230 - Disney 100 Years",
    link: "https://www.vinted.fr/items/4385404925-lego-43230-disney-100-years",
    price: 80,
    released: "2024-09-21",
    uuid: "f2c5377c-84f9-571d-8712-98902dcbb913",
  },
  {
    title: "Istruzioni Lego 43230",
    link: "https://www.vinted.fr/items/4576548365-istruzioni-lego-43230",
    price: 8,
    released: "2024-09-16",
    uuid: "e90b87b4-abba-5554-ba03-47981dc1041c",
  },
  {
    title: "Lego Disney dumbo ",
    link: "https://www.vinted.fr/items/4049649178-lego-disney-dumbo",
    price: 16,
    released: "2024-09-15",
    uuid: "ac861b7e-e3bf-5e76-aa0d-1dc8a2544901",
  },
  {
    title: "Lego Disney 100 43230",
    link: "https://www.vinted.fr/items/4648154373-lego-disney-100-43230",
    price: 80,
    released: "2024-09-21",
    uuid: "b5ad9808-18d9-5d98-a32b-c7aa57b391fd",
  },
  {
    title: "Légo Caméra Disney 100ans 43230",
    link: "https://www.vinted.fr/items/4126171841-lego-camera-disney-100ans-43230",
    price: 90,
    released: "2024-09-17",
    uuid: "a4ca82af-3e8b-518a-8f55-59e0cbc1d81d",
  },
  {
    title: "Lego 43230 Disney new",
    link: "https://www.vinted.fr/items/3872250639-lego-43230-disney-new",
    price: 85,
    released: "2024-09-15",
    uuid: "5eb7f1d4-f871-526f-93e0-7b65057f68fd",
  },
  {
    title: "Lego 43230",
    link: "https://www.vinted.fr/items/3588915159-lego-43230",
    price: 84,
    released: "2024-09-20",
    uuid: "ffc42f22-259c-5c06-b190-784577a2f282",
  },
  {
    title: "Lego 43230 Disney 100 Years",
    link: "https://www.vinted.fr/items/4896899367-lego-43230-disney-100-years",
    price: 90,
    released: "2024-09-16",
    uuid: "b7c5c9b6-0b5e-553a-898f-c37f53062088",
  },
  {
    title: "La caméra Hommage à Walt Disney lego set 43230",
    link: "https://www.vinted.fr/items/4872522741-la-camera-hommage-a-walt-disney-lego-set-43230",
    price: 95,
    released: "2024-09-15",
    uuid: "5357bbf5-7232-5a6a-b48c-1e4f9a26ac68",
  },
  {
    title: "LEGO Disney Cinepresa Omaggio a Walt Disney",
    link: "https://www.vinted.fr/items/4804901822-lego-disney-cinepresa-omaggio-a-walt-disney",
    price: 100,
    released: "2024-09-17",
    uuid: "6819f6aa-5f4d-5acf-a663-caa52d8a8c90",
  },
  {
    title: "Nieuw lego 100j disney camera 43230",
    link: "https://www.vinted.fr/items/4210242141-nieuw-lego-100j-disney-camera-43230",
    price: 89,
    released: "2024-09-21",
    uuid: "493893cb-eb3b-5e0b-aa93-2b0d40723282",
  },
  {
    title: "Lego Disney 43212 Le train en fête 100 ans édition limitée ",
    link: "https://www.vinted.fr/items/4169227310-lego-disney-43212-le-train-en-fete-100-ans-edition-limitee",
    price: 34,
    released: "2024-09-16",
    uuid: "8f94784c-0871-53f4-abed-aebffabcd25a",
  },
  {
    title: "Lego 43230 cinepresa Disney",
    link: "https://www.vinted.fr/items/4111571308-lego-43230-cinepresa-disney",
    price: 90,
    released: "2024-09-16",
    uuid: "bd568392-3a6d-54e0-a8e2-20791cf59ea6",
  },
];

/**
 * 💶
 * Let's talk about money now
 * Do some Maths
 * 💶
 */

console.log("Deals on VINTED:");
console.table(VINTED);

// 🎯 TODO 11: Compute the average, the p95 and the p99 price value
// 1. Compute the average price value of the listing
// 2. Compute the p95 price value of the listing
// 3. Compute the p99 price value of the listing
// The p95 value (95th percentile) is the lower value expected to be exceeded in 95% of the vinted items

// Average
/** Calculates the average price from a list of deals.
 *
 * @param {Array} data - The list of deal objects to process.
 * @returns {number} The average price, rounded to two decimal places.
 * @throws {Error} If any error occurs during the calculation.
 */
function getPriceAverage(data) {
  try {
    // Filter out deals that have a valid price and calculate the sum of their prices
    let totalPrice = data
      .filter((deal) => deal.price !== null) // Remove deals without a price
      .reduce((sum, deal) => sum + deal.price, 0); // Sum all the prices

    // Count the number of deals that have a valid price
    let countDeals = data.filter((deal) => deal.price !== null).length;

    // Calculate and return the average price
    let averagePrice = totalPrice / countDeals;
    return Number(averagePrice.toFixed(2)); // Round the average to the 100th
  } catch (e) {
    console.log(e);
  }
}

var vintedAverage = getPriceAverage(VINTED);
console.log(`Average price on Vinted: €${vintedAverage}`);

/** Calculate the 'q' quartile of an array of values
 *
 * @param arr - array of values
 * @param q - percentile to calculate (e.g. 95)
 *
 * @see {@link https://snippets.bentasker.co.uk/page-1907020841-Calculating-Mean,-Median,-Mode,-Range-and-Percentiles-with-Javascript-Javascript.html|Original source} for the quartile calculation method.
 *
 */
function calcQuartile(arr, q) {
  let a = arr.slice();
  // Turn q into a decimal (e.g. 95 becomes 0.95)
  q = q / 100;

  // Sort the array into ascending order
  let data = sortDealsByPrice(a, true);

  // Work out the position in the array of the percentile point
  let p = (data.length - 1) * q;
  let b = Math.floor(p);

  // Work out what we rounded off (if anything)
  let remainder = p - b;

  // See whether that data exists directly
  if (data[b + 1].price !== undefined) {
    return (
      parseFloat(data[b].price) +
      remainder * (parseFloat(data[b + 1].price) - parseFloat(data[b].price))
    );
  } else {
    return parseFloat(data[b].price);
  }
}

// 95th percentile price value
var p95Price = calcQuartile(VINTED, 95);
console.log(`Price's 95th percentile: €${p95Price}`);

// 99th percentile price value
var p99Price = calcQuartile(VINTED, 99);
console.log(`Price's 99th percentile: €${p99Price}`);

// 🎯 TODO 12: Very old listed items
// // 1. Log if we have very old items (true or false)
// // A very old item is an item `released` more than 3 weeks ago.

/** Checks whether an item is considered "old" (released more than 3 weeks ago).
 *
 * @param {Object} item - The item to check. Must have a `released` property in a date string format.
 * @param {string} item.released - The release date of the item, formatted as a string (e.g., "2024-09-01").
 * @returns {boolean} `true` if the item is older than 3 weeks, `false` otherwise.
 * @throws {Error} If an error occurs while parsing the date.
 */
function isOldItem(item) {
  try {
    let today = Date.now();
    let spanFor3Weeks = 60 * 60 * 24 * 21 * 1e3; // 60 seconds * 60 minutes * 24 hours * 21 days * 1000 milliseconds (1e3)
    return today - Date.parse(item.released) > spanFor3Weeks;
  } catch (e) {
    console.log(e);
  }
}

// console.log("Is Sept. 1st, 2024 considered old: ");
// console.log(
//   isOldItem({
//     title: "",
//     link: "",
//     price: 0,
//     released: "2024-09-01",
//     uuid: "",
//   })
// );

/** Checks whether an array of deals contains any "old" items (released more than 3 weeks ago).
 *
 * @param {Array} data - An array of deal objects to check.
 * @param {Object} data[].released - Each deal must have a `released` property in a date string format.
 * @returns {boolean} `true` if any deal is older than 3 weeks, `false` otherwise.
 * @throws {Error} If any error occurs during the check.
 */
function containsOldItems(data) {
  try {
    return data.some((deal) => isOldItem(deal));
  } catch (e) {
    console.log(e);
  }
}

console.log(
  `Data contains deals older than 3 weeks: ${containsOldItems(VINTED)}`
);

// 🎯 TODO 13: Find a specific item
// 1. Find the item with the uuid `f2c5377c-84f9-571d-8712-98902dcbb913`
// 2. Log the item

const UUID_TO_FIND = "f2c5377c-84f9-571d-8712-98902dcbb913";

/** Finds and returns a deal by its UUID.
 *
 * @param {Array} data - An array of deal objects.
 * @param {string} id - The UUID of the deal to find.
 * @returns {Object|undefined} The deal object if found, or `undefined` if no deal matches the UUID.
 * @throws {Error} If an error occurs during the search.
 */
function findItemById(data, id) {
  try {
    return data.find((deal) => deal.uuid == id);
  } catch (e) {
    console.log(e);
  }
}

console.log(`Item with id "${UUID_TO_FIND}":`);
console.log(findItemById(VINTED, UUID_TO_FIND));

// 🎯 TODO 14: Delete a specific item
// 1. Delete the item with the uuid `f2c5377c-84f9-571d-8712-98902dcbb913`
// 2. Log the new list of items

/** Deletes a deal from the array by its UUID.
 *
 * @param {Array} data - An array of deal objects.
 * @param {string} id - The UUID of the deal to delete.
 * @throws {Error} If the item cannot be found or if an error occurs during deletion.
 */
function deleteItem(data, id) {
  try {
    let indexItemToDelete = data.indexOf(findItemById(data, id));

    // Delete only one element staring from this index
    data.splice(indexItemToDelete, 1);
  } catch (e) {
    console.log(e);
  }
}

deleteItem(VINTED, UUID_TO_FIND);
console.table(VINTED);

// 🎯 TODO 15: Save a favorite item
// We declare and assign a variable called `sealedCamera`
let sealedCamera = {
  title: "La caméra Hommage à Walt Disney lego set 43230",
  link: "https://www.vinted.fr/items/4872522741-la-camera-hommage-a-walt-disney-lego-set-43230",
  price: 95,
  released: "2024-09-15",
  uuid: "5357bbf5-7232-5a6a-b48c-1e4f9a26ac68",
};

// we make a copy of `sealedCamera` to `camera` variable
// and set a new property `favorite` to true
let camera = sealedCamera;

camera.favorite = true;

// 1. Log `sealedCamera` and `camera` variables
console.log(sealedCamera);
console.log(camera);

// 2. What do you notice?
// `sealedCamera` also has its "favorite" property set to true...

// we make (again) a new assignment again
sealedCamera = {
  title: "La caméra Hommage à Walt Disney lego set 43230",
  link: "https://www.vinted.fr/items/4872522741-la-camera-hommage-a-walt-disney-lego-set-43230",
  price: 95,
  released: "2024-09-15",
  uuid: "5357bbf5-7232-5a6a-b48c-1e4f9a26ac68",
};

// 3. Update `camera` property with `favorite` to true WITHOUT changing sealedCamera properties
// Copy all the properties with spread syntax, and add `favorite`
camera = { ...sealedCamera, favorite: true };

console.log(sealedCamera);
console.log(camera);

// 🎯 TODO 16: Compute the profitability
// From a specific deal called `deal`
const deal = {
  title: "La caméra Hommage à Walt Disney",
  retail: 75.98, // price of origin (?)
  price: 56.98, // price offered by reseller (?)
  legoId: "43230",
};

// 1. Compute the potential highest profitability based on the VINTED items
// 2. Log the value

/** Finds the highest profitability of a given item compared to other deals.
 *
 * @param {Array} data - An array of deal objects to compare.
 * @param {Object} item - The reference item to compute profitability for. Must have a `legoId` and `price` property.
 * @param {string} item.legoId - The identifier of the item (e.g., the LEGO set ID).
 * @param {number} item.price - The purchase price of the item.
 * @returns {number} The highest profitability, rounded to two decimal places.
 */
function findHighestProfitability(data, item) {
  // Get items referencing the right Lego set
  let matchingItems = data.filter((deal) => deal.title.includes(item.legoId));

  // Get the highest resale price
  const highestResalePrice = Math.max(
    ...matchingItems.map((item) => item.price)
  );

  // Compute profitability
  return Number((highestResalePrice - item.price).toFixed(2));
}

console.log(
  `Highest profitability for Lego ${
    deal.legoId
  } amongst VINTED deals: €${findHighestProfitability(VINTED, deal)}`
);

/**
 * 🎬
 * The End: last thing to do
 * 🎬
 */

// 🎯 LAST TODO: Save in localStorage
// 1. Save MY_FAVORITE_DEALERS in the localStorage
// 2. log the localStorage

localStorage.setItem("myFavoriteDealers", JSON.stringify(MY_FAVORITE_DEALERS));
console.log(localStorage);
