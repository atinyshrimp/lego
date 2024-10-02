// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
"use strict";

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
        return data.filter(
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

/** Filters the deals by the number of comments
 *
 * @param {Array} data - The list of deals to filter
 * @param {Number} [lowerBound = 15] - The minimum number of comments to find within `deals`. Defaults to 15.
 * @returns {Array} - The filtered deals with more than `lowerBound` comments
 */
function filterDealsByComments(data, lowerBound = 15) {
  try {
    return data.filter((deal) => deal.comments >= lowerBound);
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
    return data.filter((deal) => deal.temperature >= lowerBound);
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
    console.log(totalPrice);

    // Count the number of sales that have a valid discount
    const countSales = sales.filter((sale) => sale.discount !== null).length;
    console.log(countSales);

    // Calculate and return the average discount
    const averageDiscount = totalPrice / countSales;
    return Number(averageDiscount.toFixed(2)); // Round the average to the 100th
  } catch (e) {
    console.log(e);
  }
}
