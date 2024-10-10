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
let currentSales = [];
let currentPagination = {};

// instantiate the selectors
const selectShow = document.querySelector("#show-select");
const selectPage = document.querySelector("#page-select");
const selectLegoSetIds = document.querySelector("#lego-set-id-select");
const sectionDeals = document.querySelector("#nav-deals");
const spanNbDeals = document.querySelector("#nbDeals");
const sectionSales = document.querySelector("#nav-sales");
const spanNbSales = document.querySelector("#nbSales");
const spanAvgPrice = document.querySelector("#averagePrice");
const spanP5Price = document.querySelector("#p5Price");
const spanP25Price = document.querySelector("#p25Price");
const spanP50Price = document.querySelector("#p50Price");
const spanLifetime = document.querySelector("#lifetimeValue");
const filters = document.querySelector("#filters");
const selectSort = document.querySelector("#sort-select");

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

/** Fetch sales from API
 *
 * @param {String} id - The ID of the lego set to look up
 * @returns A list of Vinted sales for the `id`
 */
const fetchSales = async (id) => {
	try {
		const response = await fetch(
			`https://lego-api-blue.vercel.app/sales?id=${id}`
		);
		const body = await response.json();

		if (body.success !== true) {
			console.error(body);
			return null;
		}

		return body.data.result;
	} catch (error) {
		console.error(error);
		return null;
	}
};

/**
 * Render list of deals
 * @param  {Array} deals
 */
const renderDeals = (deals) => {
	sectionDeals.innerHTML = "";

	const fragment = document.createDocumentFragment();
	const div = document.createElement("div");
	const template = deals
		.map((deal) => {
			const isFavorite = isFavoriteDeal(deal.uuid);
			return `
      <div class="col-4">
        <div class="deal card mb-4" id=${deal.uuid}">
          <div class="card-body d-block">
            <div class="row">
              <div class="col-md-9">
                <a href="${deal.link}" target="_blank">
                  <h5 class="card-title clamp-2-lines">${deal.title}</h5>
                </a>
              </div>
              <button class="btn col favorite-btn" style="width: fit-content;" data-id="${
								deal.uuid
							}">
                ${isFavorite ? DEL_FAV_ICON : ADD_FAV_ICON}
              </button>
                <h6 class="card-subtitle mb-2 text-muted">${deal.id}</h6>
            </div>
            <p class="badge rounded-pill text-bg-danger mb-0">${
							deal.temperature
						}°</p>
            <p class="card-text text-decoration-line-through text-muted mb-0">${formatPrice(
							deal.retail
						)}</p>
            <p class="card-text mb-0">${formatPrice(deal.price)}</p>
          </div>
        </div>
      </div>
    `;
		})
		.join("");

	div.classList.add("row");
	div.id = "deals-items";
	div.classList.add("overflow-auto");
	div.innerHTML = template;
	fragment.appendChild(div);
	sectionDeals.appendChild(fragment);

	// Attach listener to the favorite buttons
	document.querySelectorAll(".favorite-btn").forEach((button) => {
		button.addEventListener("click", toggleFavorite);
	});
};

/** Render list of Vinted sales
 *
 * @param {Array} sales
 */
const renderSales = (sales) => {
	const fragment = document.createDocumentFragment();
	const div = document.createElement("div");
	const template = sales
		.map((sale) => {
			return `
      <div class="sale" id=${sale.uuid}>
        <span>${selectLegoSetIds.value}</span>
        <a href="${sale.link}" target="_blank">${sale.title}</a>
        <span>${sale.price}</span>
      </div>
    `;
		})
		.join("");

	div.innerHTML = template;
	fragment.appendChild(div);
	sectionSales.appendChild(fragment);
	renderIndicators(currentPagination);
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
	if (currentSales.length > 0) {
		spanNbSales.innerHTML = currentSales.length; // Feature 8 - Specific indicators

		// Feature 9 - average, p25, p50 and p95 price value indicators
		spanAvgPrice.innerHTML = `€ ${getSalesPriceAverage(currentSales)}`;
		spanP5Price.innerHTML = `€ ${calcQuartile(currentSales, 5).toFixed(2)}`;
		spanP25Price.innerHTML = `€ ${calcQuartile(currentSales, 25).toFixed(2)}`;
		spanP50Price.innerHTML = `€ ${calcQuartile(currentSales, 50).toFixed(2)}`;
	} else {
		spanNbSales.innerHTML = 0;
		spanAvgPrice.innerHTML = 0;
		spanP5Price.innerHTML = 0;
		spanP25Price.innerHTML = 0;
		spanP50Price.innerHTML = 0;
	}

	// Feature 10 - Lifetime value
	spanLifetime.innerHTML = calculateLifetimeValue(currentSales);
};

const render = async (deals, pagination) => {
	renderDeals(deals);
	renderPagination(pagination);
	renderIndicators(pagination);
	renderLegoSetIds(deals);
};

const renderPaginatedDeals = (deals) => {
	// Paginate the new deals before rendering
	const paginatedDeals = paginateDeals(
		deals,
		currentPagination.currentPage,
		selectShow.value
	);

	// Update pagination meta for new results
	const newPagination = {
		currentPage: 1,
		pageCount: Math.ceil(deals.length / parseInt(selectShow.value)),
		pageSize: parseInt(selectShow.value),
		count: deals.length,
	};

	setCurrentDeals({
		result: paginatedDeals,
		meta: newPagination,
	});

	render(currentDeals, currentPagination);
};

/**
 * Declaration of all Listeners
 */

// Select the number of deals to display
selectShow.addEventListener("change", async (event) => {
	const newPageSize = parseInt(event.target.value);
	const maxPage =
		Math.trunc(currentDeals.length / currentPagination.pageSize) + 1;
	const newPage =
		currentPagination.currentPage <= maxPage
			? currentPagination.currentPage
			: maxPage;

	const deals = await fetchDeals(newPage, newPageSize);
	console.table(deals);

	setCurrentDeals(deals);
	render(currentDeals, currentPagination);
});

// Feature 1 - Browse pages
selectPage.addEventListener("change", async (event) => {
	const page = parseInt(event.target.value);
	const deals = await fetchDeals(page, selectShow.value);

	setCurrentDeals(deals);
	render(currentDeals, currentPagination);
});

// Filter Features
filters.querySelectorAll("span").forEach((filterOption) => {
	filterOption.addEventListener("click", async () => {
		let filteredDeals;

		// Fetch all deals first (assuming we are fetching all available data)
		let allDeals = await fetchDeals(1, currentPagination.count);
		allDeals = allDeals.result;

		// Apply the filter based on the filter option selected
		switch (filterOption.innerHTML) {
			// Feature 2 - Filter by best discount
			case "By best discount":
				filteredDeals = filterDealsByDiscount(currentDeals, 50);
				break;

			// Feature 3 - Filter by most commented
			case "By most commented":
				filteredDeals = filterDealsByComments(currentDeals);
				break;

			// Feature 4 - Filter by hot deals
			case "By hot deals":
				filteredDeals = filterDealsByTemperature(currentDeals);
				break;

			// Feature 14 - Filter by favorites
			case "By favorites":
				filteredDeals = allDeals.filter((deal) => isFavoriteDeal(deal.uuid));
				break;

			default:
				filteredDeals = currentDeals; // Default, no filtering
				break;
		}

		renderPaginatedDeals(filteredDeals);
	});
});

/** Sorting */
selectSort.addEventListener("change", async (event) => {
	// Fetch all deals first (assuming we are fetching all available data)
	const allDeals = await fetchDeals(1, currentPagination.count);
	setCurrentDeals(allDeals);
	let sortedDeals = sortDeals(currentDeals, event.target.value);

	renderPaginatedDeals(sortedDeals);
});

// Feature 7 - Display Vinted sales
selectLegoSetIds.addEventListener("change", async (event) => {
	const selectedSet = event.target.value;
	currentSales = await fetchSales(selectedSet);
	renderSales(currentSales);
});

document.addEventListener("DOMContentLoaded", async () => {
	const deals = await fetchDeals();

	setCurrentDeals(deals);
	render(currentDeals, currentPagination);
});
