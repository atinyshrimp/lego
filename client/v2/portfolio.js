// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
"use strict";

/**
Description of the available api
GET https://lego-api-blue.vercel.app/deals

Search for specific deals

This endpoint accepts the following optional query string parameters:

- `page` - page of deals to return
- `size` - number of deals to return

GET https://lego-api-blue.vercel.app/sales

Search for current Vinted sales for a given lego set id

This endpoint accepts the following optional query string parameters:

- `id` - lego set id to return
*/

// current deals on the page
let currentDeals = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector("#show-select");
const selectPage = document.querySelector("#page-select");
const selectLegoSetIds = document.querySelector("#lego-set-id-select");
const sectionDeals = document.querySelector("#deals");
const spanNbDeals = document.querySelector("#nbDeals");

/**
 * Set global value
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({ result, meta }) => {
  currentDeals = result;
  currentPagination = meta;
};

/**
 * Fetch deals from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=6] - size of the page
 * @return {Object}
 */
const fetchDeals = async (page = 1, size = 6) => {
  try {
    const response = await fetch(
      `https://lego-api-blue.vercel.app/deals?page=${page}&size=${size}`
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(body);
      return { currentDeals, currentPagination };
    }

    return body.data;
  } catch (error) {
    console.error(error);
    return { currentDeals, currentPagination };
  }
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = (deals) => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement("div");
  const template = deals
    .map((deal) => {
      return `
      <div class="deal" id=${deal.uuid}>
        <span>${deal.id}</span>
        <a href="${deal.link}">${deal.title}</a>
        <span>${deal.price}</span>
      </div>
    `;
    })
    .join("");

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.innerHTML = "<h2>Deals</h2>";
  sectionDeals.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = (pagination) => {
  const { currentPage, pageCount } = pagination;
  const options = Array.from(
    { length: pageCount },
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join("");

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render lego set ids selector
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = (deals) => {
  const ids = getIdsFromDeals(deals);
  const options = ids
    .map((id) => `<option value="${id}">${id}</option>`)
    .join("");

  selectLegoSetIds.innerHTML = options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = (pagination) => {
  const { count } = pagination;

  spanNbDeals.innerHTML = count;
};

const render = (deals, pagination) => {
  renderDeals(deals);
  renderPagination(pagination);
  renderIndicators(pagination);
  renderLegoSetIds(deals);
};

/**
 * Declaration of all Listeners
 */

/**
 * Select the number of deals to display
 */
selectShow.addEventListener("change", async (event) => {
  const newPageSize = parseInt(event.target.value);
  const maxPage =
    Math.trunc(currentDeals.length / currentPagination.pageSize) + 1;
  const newPage =
    currentPagination.currentPage <= maxPage
      ? currentPagination.currentPage
      : maxPage;

  const deals = await fetchDeals(newPage, newPageSize);

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

/**
 * Feature 1 - Browse pages
 */
selectPage.addEventListener("change", async (event) => {
  const page = parseInt(event.target.value);
  const deals = await fetchDeals(page, selectShow.value);

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});

/**
 * Filter Features
 */
let filters = document.querySelector("#filters");
filters.querySelectorAll("span").forEach((filterOption) => {
  filterOption.addEventListener("click", async (event) => {
    let filteredDeals;

    // Fetch all deals first (assuming we are fetching all available data)
    const allDeals = await fetchDeals(1, currentPagination.count);
    setCurrentDeals(allDeals);

    // Apply the filter based on the filter option selected
    switch (filterOption.innerHTML) {
      case "By best discount": // Feature 2 - Filter by best discount
        filteredDeals = filterDealsByDiscount(currentDeals, 50);
        break;

      case "By most commented": // Feature 3 - Filter by most commented
        filteredDeals = filterDealsByComments(currentDeals);
        break;

      case "By hot deals": // Feature 4 - Filter by hot deals
        filteredDeals = filterDealsByTemperature(currentDeals);
        break;

      default:
        filteredDeals = currentDeals; // Default, no filtering
        break;
    }

    // Paginate the filtered deals before rendering
    const paginatedDeals = paginateDeals(
      filteredDeals,
      currentPagination.currentPage,
      selectShow.value
    );

    // Update pagination meta for filtered results
    const filteredPagination = {
      currentPage: 1,
      pageCount: Math.ceil(filteredDeals.length / parseInt(selectShow.value)),
      pageSize: parseInt(selectShow.value),
      count: filteredDeals.length,
    };

    // Render paginated filtered deals
    setCurrentDeals({ result: paginatedDeals, meta: filteredPagination });
    render(currentDeals, currentPagination);
    console.table(currentPagination);
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});
