// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
"use strict";

const ADD_FAV_ICON = `<i class="fi fi-rs-heart" style="color: var(--bu-text);"></i>`;
const DEL_FAV_ICON = `
<i class="fi fi-ss-heart" style="color: #E02A29;"></i>`;
const DARK_MODE_CLASS = "dark-mode";

/**
 *
 * @param {Array} deals - list of deals
 * @returns {Array} list of lego set ids
 */
const getIdsFromDeals = (deals) => {
  return Array.from(new Set(deals.map((deal) => deal.id)));
};

/** Filters the deals based on a discount percentage range.
 *@param {Array} data - The list to filter
 * @param {number} [rangeBeg = 0] - The beginning of the discount range (inclusive). Must be between 0 and 100. Defaults to 0.
 * @param {number} [rangeEnd = 100] - The end of the discount range (inclusive). Must be between 0 and 100. Defaults to 100.
 * @returns {Array} A new array of deals that have a discount within the specified range.
 * @throws {RangeError} If `rangeBeg` is greater than or equal to `rangeEnd`.
 * @throws {RangeError} If `rangeBeg` or `rangeEnd` is outside the allowed range (0 to 100).
 */
function filterDealsByDiscount(data, rangeBeg = 0, rangeEnd = 100) {
  try {
    if (rangeBeg >= 0 && rangeEnd <= 100) {
      if (rangeBeg < rangeEnd) {
        return data
          .filter(
            (deal) => deal.discount >= rangeBeg && deal.discount <= rangeEnd
          )
          .sort((a, b) => b.discount - a.discount);
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

/** Filters the deals by the number of comments
 *
 * @param {Array} data - The list of deals to filter
 * @param {Number} [lowerBound = 15] - The minimum number of comments to find within `deals`. Defaults to 15.
 * @returns {Array} - The filtered deals with more than `lowerBound` comments
 */
function filterDealsByComments(data, lowerBound = 15) {
  try {
    return data
      .filter((deal) => deal.comments >= lowerBound)
      .sort((a, b) => b.comments - a.comments);
  } catch (e) {
    console.log(e);
  }
}

/** Filters the deals by the temperature of the deals
 *
 * @param {Array} data - The list of deals to filter
 * @param {Number} [lowerBound = 100] - The minimum number temperature to find within `deals`. Defaults to 100.
 * @returns {Array} - The filtered deals which temperature is higher than `lowerBound`
 */
function filterDealsByTemperature(data, lowerBound = 100) {
  try {
    return data
      .filter((deal) => deal.temperature >= lowerBound)
      .sort((a, b) => b.temperature - a.temperature);
  } catch (e) {
    console.log(e);
  }
}

/** Paginate deals based on the current page and page size
 *
 * @param {Array} deals - The list of deals to paginate
 * @param {Number} [page = 1] - The current page
 * @param {Number} [size = 6] - The number of deals per page
 * @returns {Array} - Paginated deals
 */
function paginateDeals(deals, page = 1, size = 6) {
  const startIndex = (page - 1) * size;
  const endIndex = startIndex + size;
  return deals.slice(startIndex, endIndex);
}

/** Sorts an array of deals by their `price` property.
 *
 * @param {Array} deals - The list of deal objects to be sorted.
 * @param {String} selectValue - Name of the property according to which the sorting must be made.
 * @returns {Array} A new array of deals sorted by the property given by `selectedValue`.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort|Reference} for sorting functionality.
 */
function sortDeals(deals, selectValue) {
  try {
    const splittedValue = selectValue.split("-");
    const ascending = splittedValue[1] === "asc" ? true : false;
    let propName = splittedValue[0];
    propName = propName === "date" ? "published" : propName;

    return deals.sort((a, b) =>
      ascending ? a[propName] - b[propName] : b[propName] - a[propName]
    );
  } catch (e) {
    console.log(e);
  }
}

// Feature 9 - average, p25, p50 and p95 price value indicators
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
  let data = sortDeals(a, "price-asc");

  // Work out the position in the array of the percentile point
  let p = (data.length - 1) * q;
  let b = Math.floor(p);

  // Work out what we rounded off (if anything)
  let remainder = p - b;

  // See whether that data exists directly
  if (data.length > 1 && data[b + 1].price !== undefined) {
    return (
      parseFloat(data[b].price) +
      remainder * (parseFloat(data[b + 1].price) - parseFloat(data[b].price))
    );
  } else {
    return parseFloat(data[b].price);
  }
}

/** Calculates the average discount percentage from a list of deals.
 *
 * @param {Array} sales - The list of deal objects to process.
 * @returns {number} The average price, rounded to two decimal places.
 * @throws {Error} If any error occurs during calculation.
 */
function getSalesPriceAverage(sales) {
  try {
    // Filter out sales that have a valid price and calculate the sum of their discounts
    const totalPrice = sales
      .filter((sale) => parseFloat(sale.price) !== null) // Remove sales without a discount
      .reduce((sum, sale) => sum + parseFloat(sale.price), 0); // Sum all the discounts

    // Count the number of sales that have a valid discount
    const countSales = sales.filter((sale) => sale.discount !== null).length;

    // Calculate and return the average discount
    const averageDiscount = totalPrice / countSales;
    return Number(averageDiscount.toFixed(2)); // Round the average to the 100th
  } catch (e) {
    console.log(e);
  }
}

function calculateSalesIndicators(sales) {
  return {
    average: getSalesPriceAverage(sales),
    p25: calcQuartile(sales, 25),
    p50: calcQuartile(sales, 50),
    p95: calcQuartile(sales, 95),
  };
}

// Feature 10 - Lifetime value
const calculateLifetimeValue = (sales) => {
  if (sales.length === 0) {
    return "No data to analyze";
  }

  // Extract the dates from the sales data
  const salesDates = sales.map((sale) => new Date(sale.published * 1e3));

  // Find the earliest & latest sales
  const earliestDate = new Date(Math.min(...salesDates));
  const latestDate = new Date(Math.max(...salesDates));

  // Calculate the difference in time and convert to days
  const diffTime = Math.abs(latestDate - earliestDate);
  const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));

  return diffDays > 0 ? `${diffDays} days` : "1 day";
};

// Feature 13 - Save as favorite
const getFavoriteDeals = () => {
  const favorites = localStorage.getItem("favoriteDeals");
  return favorites ? JSON.parse(favorites) : [];
};

const saveFavoriteDeals = (favorites) => {
  localStorage.setItem("favoriteDeals", JSON.stringify(favorites));
};

const isFavoriteDeal = (dealId) => {
  const favorites = getFavoriteDeals();
  return favorites.includes(dealId);
};

const toggleFavorite = (event) => {
  const dealId = event.target.getAttribute("data-id");
  let favorites = getFavoriteDeals();

  if (favorites.includes(dealId)) {
    // If the deal if already a favorite, we remove it
    favorites = favorites.filter((id) => id !== dealId);
    event.target.innerHTML = ADD_FAV_ICON;
  } else {
    favorites.push(dealId);
    event.target.innerHTML = DEL_FAV_ICON;
  }

  saveFavoriteDeals(favorites);
  console.table(getFavoriteDeals());
};

/** Formats a number into a readable currency
 *
 * @param {Number} number - Number to format
 * @returns {String} A string including the symbol for the currency, and the formatted number according to the locale
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat|Reference}
 */
function formatPrice(number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(number);
}

function isTabActive(tabId) {
  const tab = document.querySelector(`#${tabId}`);
  return tab.classList.contains("active");
}

// Function to enable dark mode
const enableDarkMode = () => {
  document.body.classList.add(DARK_MODE_CLASS);

  localStorage.setItem("darkMode", "enabled"); // Save user preference
  document.querySelector(".form-check-label").innerHTML = "Peak the sunlight";
};

// Function to disable dark mode
const disableDarkMode = () => {
  document.body.classList.remove(DARK_MODE_CLASS);

  localStorage.setItem("darkMode", "disabled"); // Save user preference
  document.querySelector(".form-check-label").innerHTML = "Enable dark mode";
};

function isDarkModeEnabled() {
  return localStorage.getItem("darkMode") === "enabled";
}

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
  console.log(item.legoId);
  console.table(matchingItems);

  // Get the highest resale price
  const highestResalePrice = Math.max(
    ...matchingItems.map((item) => item.price)
  );

  // Compute profitability
  return Number(
    (((item.price - highestResalePrice) * 100) / highestResalePrice).toFixed(2)
  );
}

function getProfitability(deal, sale) {
  return Number(((sale.price - deal.price) / deal.price) * 100).toFixed(2);
}

/**
 * Converts a Unix timestamp to a human-readable relative time string
 * @param {number} unixTime - The Unix timestamp in seconds
 * @returns {string} - A string representing the relative time (e.g., "a month ago")
 */
function timeAgo(unixTime) {
  const currentTime = Date.now();
  const publicationTime = unixTime * 1000; // Convert Unix time to milliseconds
  const elapsedTime = currentTime - publicationTime;

  const seconds = Math.floor(elapsedTime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 1) return `${years} years ago`;
  if (years === 1) return "a year ago";
  if (months > 1) return `${months} months ago`;
  if (months === 1) return "a month ago";
  if (days > 1) return `${days} days ago`;
  if (days === 1) return "a day ago";
  if (hours > 1) return `${hours} hours ago`;
  if (hours === 1) return "an hour ago";
  if (minutes > 1) return `${minutes} minutes ago`;
  if (minutes === 1) return "a minute ago";
  if (seconds > 1) return `${seconds} seconds ago`;
  return "just now";
}

// Function to process sales data and count occurrences of each price
function getPriceFrequency(sales) {
  const priceCount = {};

  // Count each price occurrence
  sales.forEach((sale) => {
    const price = parseFloat(sale.price);
    priceCount[price] = (priceCount[price] || 0) + 1;
  });

  // Extract unique prices and their counts
  const prices = Object.keys(priceCount)
    .map((price) => parseFloat(price))
    .sort((a, b) => a - b);
  const frequencies = prices.map((price) => priceCount[price]);

  return { prices, frequencies };
}
