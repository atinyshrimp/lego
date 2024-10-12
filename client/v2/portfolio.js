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
let unfilteredDeals = [];
let currentSales = [];
let currentPagination = {};
let isListFiltered = false;

// instantiate the selectors
const darkModeToggle = document.getElementById("darkModeToggle");
const savedDarkMode = localStorage.getItem("darkMode");
const selectShow = document.querySelector("#show-select");
const selectPage = document.querySelector("#page-select");
const selectLegoSetIds = document.querySelector("#lego-set-id-select");
const paginationInfo = document.querySelector("#pagination-info");
const sectionDeals = document.querySelector("#nav-deals");
const sectionSales = document.querySelector("#nav-sales");
const sectionIndicators = document.getElementById("indicators");
const sectionOptions = document.getElementById("options");
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
        <div class="card mb-4" id=${deal.uuid}">
          <div class="card-body d-block">
            <div class="row">
              <div class="col-md-9" style="width: 85%;">
                <a href="${deal.link}" target="_blank"">
                  <h5 class="card-title clamp-2-lines">${deal.title}</h5>
                </a>
              </div>
              <div class="col px-0 ms-2">
                <button class="btn favorite-btn" style="width: fit-content;" data-id="${
                  deal.uuid
                }">
                  ${isFavorite ? DEL_FAV_ICON : ADD_FAV_ICON}
                </button>
              </div>
                <h6 class="card-subtitle mb-2 text-muted">${deal.id}</h6>
            </div>
            <p class="badge rounded-pill text-bg-danger mb-0">${
              deal.temperature
            }°</p>
            <p class="card-text text-decoration-line-through text-muted mb-0">${formatPrice(
              deal.retail
            )}</p>
            <p class="card-text mb-0" id="deal-price">${formatPrice(
              deal.price
            )}</p>
          </div>
        </div>
      </div>
    `;
    })
    .join("");

  div.classList.add("row");
  div.classList.add("items");
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
const renderSales = async (sales) => {
  sectionSales.innerHTML = "";

  const fragment = document.createDocumentFragment();
  const div = document.createElement("div");
  let allDeals = await fetchDeals(1, currentPagination.count);
  allDeals = allDeals.result;

  let template;
  if (sales !== undefined) {
    const legoId = selectLegoSetIds.value;
    template = sales
      // sorting the sales by highest profitability
      .sort(
        (a, b) =>
          findHighestProfitability(allDeals, {
            legoId: legoId,
            price: b.price,
          }) -
          findHighestProfitability(allDeals, { legoId: legoId, price: a.price })
      )
      .map((sale) => {
        return `
        <div class="col-4">
          <div class="card mb-4" id=${sale.uuid}">
            <div class="card-body d-block">
              <div class="row">
                <div class="col-md-9" style="width: 85%;">
                  <a href="${sale.link}" target="_blank"">
                    <h5 class="card-title clamp-2-lines">${sale.title}</h5>
                  </a>
                </div>
                <div class="col px-0 ms-2">
                  <button class="btn favorite-btn" style="width: fit-content; display: none;" data-id="${
                    sale.uuid
                  }">
                    ${ADD_FAV_ICON}
                  </button>
                </div>
                  <h6 class="card-subtitle mb-2 text-muted">${legoId}</h6>
              </div>
              <p class="badge rounded-pill text-bg-info mb-0">${findHighestProfitability(
                allDeals,
                {
                  legoId: legoId,
                  price: sale.price,
                }
              )}%</p>
              <p class="card-text mb-0" id="sale-price">${formatPrice(
                sale.price
              )}</p>
            </div>
          </div>
        </div>
      `;
      })
      .join("");
  } else {
    currentSales = [];
    template = `
      <div class="alert alert-warning" role="alert">
        Choose a Lego set to filter the sales by!
      </div>
      `;
  }

  div.classList.add("row");
  div.classList.add("items");
  div.classList.add("overflow-auto");
  div.innerHTML = template;
  fragment.appendChild(div);
  sectionSales.appendChild(fragment);
  renderPagination(currentPagination);
  renderIndicators(currentPagination);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = (pagination) => {
  const { currentPage, pageCount } = pagination;
  const paginationContainer = document.querySelector(".pagination");

  paginationContainer.innerHTML = ""; // Clear previous pagination

  // Feature 1 - Browse pages
  // Previous button
  const prevDisabled = currentPage === 1 ? "disabled" : "";
  paginationContainer.innerHTML += `
    <li class="page-item ${prevDisabled}">
      <a class="page-link" href="#" aria-label="Previous" data-page="${
        currentPage - 1
      }">
        <i class="fi fi-rr-caret-left"></i>
      </a>
    </li>
  `;

  // Page numbers
  for (let page = 1; page <= pageCount; page++) {
    const activeClass = page === currentPage ? "active" : "";
    paginationContainer.innerHTML += `
      <li class="page-item ${activeClass}">
        <a class="page-link" href="#" data-page="${page}">${page}</a>
      </li>
    `;
  }

  // Next button
  const nextDisabled = currentPage === pageCount ? "disabled" : "";
  paginationContainer.innerHTML += `
    <li class="page-item ${nextDisabled}">
      <a class="page-link" href="#" aria-label="Next" data-page="${
        currentPage + 1
      }">
        <i class="fi fi-rr-caret-right"></i>
      </a>
    </li>
  `;

  // Add event listeners to pagination links
  document.querySelectorAll(".page-link").forEach((link) => {
    link.addEventListener("click", async (event) => {
      event.preventDefault();
      const page = parseInt(event.target.getAttribute("data-page"));
      if (!isNaN(page)) {
        const newDeals = await fetchDeals(page, selectShow.value);
        setCurrentDeals(newDeals);
        render(currentDeals, currentPagination); // Re-render deals and pagination
      }
    });
  });

  const itemsPerPage = parseInt(selectShow.value);
  const rangeBeg = (currentPage - 1) * itemsPerPage + 1;
  const rangeEnd = currentPage * itemsPerPage;
  const nbDeals = currentPagination.count;
  const nbSales = currentSales.length > 0 ? currentSales.length : 0;

  if (isTabActive("nav-deals-tab")) {
    document.getElementById("pagination-info").style.display = "block";
    sectionOptions.style.display = "block";
    document.querySelector(".pagination").style.display = "flex";
    document.getElementById("show").style.visibility = "";

    paginationInfo.innerHTML = `
		<div class="text-muted float-end">
		Showing ${rangeBeg} - ${
      rangeEnd > nbDeals ? nbDeals : rangeEnd
    } out of ${nbDeals} deal(s)
		</div>
		`;
  } else {
    document.querySelector(".pagination").style.display = "none";
    document.getElementById("show").style.visibility = "hidden";
    sectionOptions.style.display = "none";

    if (currentSales.length === 0) {
      document.getElementById("pagination-info").style.display = "none";
      return;
    }
    document.getElementById("pagination-info").style.display = "block";

    // Feature 8 - Specific indicators
    paginationInfo.innerHTML = `
		<div class="text-muted float-end">
		Showing ${nbSales} sale(s) 
		</div>
		`;
  }
};

/** Render lego set ids selector
 *
 * @param  {Array} lego set ids
 */
const renderLegoSetIds = async (deals) => {
  const legoSection = document.getElementById("lego");
  if (isTabActive("nav-deals-tab")) {
    legoSection.style.display = "none";
    return;
  }

  legoSection.style.display = "block";
  let allDeals = await fetchDeals(1, currentPagination.count);
  allDeals = allDeals.result;

  const ids = getIdsFromDeals(allDeals);
  const placeholer = `<option selected>Lego set to filter by</option>`;
  const options = ids
    .filter((id) => id !== "")
    .sort((a, b) => a - b)
    .map((id) => `<option value="${id}">${id}</option>`)
    .join("");

  selectLegoSetIds.innerHTML = placeholer + options;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = (pagination) => {
  const { count } = pagination;

  // Hide indicators if we are on the "Deals" tab
  if (isTabActive("nav-deals-tab")) {
    sectionIndicators.style.display = "none";
    return;
  }

  // Display the indicators agains
  sectionIndicators.style.display = "block";

  if (currentSales.length > 0) {
    // Feature 9 - average, p25, p50 and p95 price value indicators
    spanAvgPrice.innerHTML = `${formatPrice(
      getSalesPriceAverage(currentSales)
    )}`;
    spanP5Price.innerHTML = `${formatPrice(
      calcQuartile(currentSales, 5).toFixed(2)
    )}`;
    spanP25Price.innerHTML = `${formatPrice(
      calcQuartile(currentSales, 25).toFixed(2)
    )}`;
    spanP50Price.innerHTML = `${formatPrice(
      calcQuartile(currentSales, 50).toFixed(2)
    )}`;
  } else {
    spanAvgPrice.innerHTML = "NaN";
    spanP5Price.innerHTML = "NaN";
    spanP25Price.innerHTML = "NaN";
    spanP50Price.innerHTML = "NaN";
  }

  // Feature 10 - Lifetime value
  spanLifetime.innerHTML = calculateLifetimeValue(currentSales);
};

const render = async (deals, pagination) => {
  renderDeals(deals);
  renderSales();
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

// Filter Features
filters.querySelectorAll("span").forEach((filterOption) => {
  filterOption.addEventListener("click", async () => {
    let filteredDeals;

    // Check if the button is already active (clicked again)
    if (filterOption.classList.contains("active")) {
      // Remove active class and go back to unfiltered deals
      filterOption.classList.remove("active");
      renderPaginatedDeals(unfilteredDeals); // Render unfiltered deals
      unfilteredDeals = [];
      isListFiltered = false;
      return; // Stop execution to prevent re-filtering
    }

    // Make sure to remove the "active" class from all buttons first
    filters.querySelectorAll("span").forEach((btn) => {
      btn.classList.remove("active");
    });

    filterOption.classList.add("active");

    const listToFilter = !isListFiltered ? currentDeals : unfilteredDeals;

    // Store the unfiltered version before filtering so we can get back to it
    unfilteredDeals = currentDeals;

    // Fetch all deals first (assuming we are fetching all available data)
    let allDeals = await fetchDeals(1, currentPagination.count);
    allDeals = allDeals.result;

    // Apply the filter based on the filter option selected
    switch (filterOption.innerHTML) {
      // Feature 2 - Filter by best discount
      case "Best discount":
        filteredDeals = filterDealsByDiscount(listToFilter, 50);
        break;

      // Feature 3 - Filter by most commented
      case "Popular":
        filteredDeals = filterDealsByComments(listToFilter);
        break;

      // Feature 4 - Filter by hot deals
      case "Hot deals":
        filteredDeals = filterDealsByTemperature(listToFilter);
        break;

      // Feature 14 - Filter by favorites
      case "Favorites":
        filteredDeals = allDeals.filter((deal) => isFavoriteDeal(deal.uuid));
        break;

      default:
        filteredDeals = unfilteredDeals; // Default, no filtering
        break;
    }
    isListFiltered = true;
    console.table(filteredDeals);
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

document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    render(currentDeals, currentPagination);
  });
});

if (savedDarkMode === "enabled") {
  enableDarkMode(); // Apply dark mode
  darkModeToggle.checked = true; // Ensure the toggle is checked
}
darkModeToggle.addEventListener("change", () => {
  if (darkModeToggle.checked) {
    enableDarkMode(); // Enable dark mode
  } else {
    disableDarkMode(); // Disable dark mode
  }
});

document.addEventListener("DOMContentLoaded", async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});
