// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
"use strict";

/**
 *
 * @param {Array} deals - list of deals
 * @returns {Array} list of lego set ids
 */
const getIdsFromDeals = (deals) => {
  return deals.map((deal) => deal.id);
};

/** Filters the deals based on a discount percentage range.
 *@param {Array} - The list to filter
 * @param {number} [rangeBeg = 0] - The beginning of the discount range (inclusive). Must be between 0 and 100. Defaults to 0.
 * @param {number} [rangeEnd = 100] - The end of the discount range (inclusive). Must be between 0 and 100. Defaults to 100.
 * @returns {Array} A new array of deals that have a discount within the specified range.
 * @throws {RangeError} If `rangeBeg` is greater than or equal to `rangeEnd`.
 * @throws {RangeError} If `rangeBeg` or `rangeEnd` is outside the allowed range (0 to 100).
 */
function filterDeals(data, rangeBeg = 0, rangeEnd = 100) {
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
