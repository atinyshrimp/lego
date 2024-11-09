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

/** Global variables and selectors
 *
 */
let currentDeals = [];
let unfilteredDeals = [];
let currentSales = [];
let currentPagination = {};
let isListFiltered = false;

// Selectors
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
const filters = document.querySelector("#filters");
const selectSort = document.querySelector("#sort-select");

// Indicator elements
const spanAvgPrice = document.querySelector("#averagePrice");
const spanP95Price = document.querySelector("#p95Price");
const spanP25Price = document.querySelector("#p25Price");
const spanP50Price = document.querySelector("#p50Price");
const spanLifetime = document.querySelector("#lifetimeValue");

/** Fetch deals from API
 *
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
    if (body.success !== true) throw new Error("Failed to fetch deals");
    return body.data;
  } catch (error) {
    console.error(error);
    return { result: currentDeals, meta: currentPagination };
  }
};

/** Fetch sales from API for a given lego set ID
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
    if (body.success !== true) throw new Error("Failed to fetch sales");
    return body.data.result;
  } catch (error) {
    console.error(error);
    return [];
  }
};

/** Create HTML template for each deal
 *
 * @param {*} deal
 * @returns
 */
const createDealTemplate = (deal) => {
  const isFavorite = isFavoriteDeal(deal.uuid);
  return `
    <div class="col-4">
      <div class="card mb-4" id=${deal.uuid}>
        <div class="card-body d-block">
          <!-- First row: Title and LEGO ID -->
          <div class="row mb-2 justify-content-between">
            <div class="col-md-3">
              <img class="img-fluid img-thumbnail" src="${deal.photo}">
            </div>
            <div class="col-md-7 pt-1 px-0">
              <a href="#" class="deal-title" data-bs-toggle="modal"  data-bs-target="#dealModal" data-uuid="${
                deal.uuid
              }" data-id="${deal.id}">
                <h5 class="card-title clamp-2-lines">${deal.title}</h5>
              </a>
              <h6 class="card-subtitle mb-2 text-muted">${deal.id}</h6>
            </div>
            <div class="col" style="width: 10%; flex: 0 0 auto;">
              <button class="btn favorite-btn" style="width: fit-content;" data-id="${
                deal.uuid
              }">
                ${isFavorite ? DEL_FAV_ICON : ADD_FAV_ICON}
              </button>
            </div>
          </div>

          <!-- Second row: Temperature and Comments on the left, Prices and CTA on the right -->
          <div class="row justify-content-between">
            <!-- Left Column: Temperature and Comments -->
            <div class="col-6 d-flex flex-column align-items-start">
              <p class="badge rounded-pill text-bg-danger mb-0">${
                deal.temperature
              }°</p>
              <div class="d-inline-flex align-items-center pt-1">
                <i class="fi fi-rr-comment-dots"></i> &nbsp;
                <p class="pb-1 m-0">${deal.comments} </p>
              </div>
              <div class="d-inline-flex align-items-center pt-1">
                <i class="fi fi-rr-pending"></i> &nbsp;
                <p class="pb-1 m-0">${timeAgo(deal.published)}</p> 
              </div>
            </div>

            <!-- Right Column: Prices and CTA Button -->
            <div class="col-6 d-flex flex-column align-items-end" style="width: fit-content;">
              <p class="card-text text-decoration-line-through text-muted mb-0 d-inline-block">${formatPrice(
                deal.retail
              )}</p>
              <p class="card-text mb-0 d-inline-block">${formatPrice(
                deal.price
              )}</p>
              <a role="button" class="btn d-inline-flex align-items-center p-0 mt-2 deal-tab" href="${
                deal.link
              }" target="_blank">
                <span style="margin-bottom:.4rem;">See deal &nbsp;</span>
                <i class="fi fi-rr-up-right-from-square"></i>
              </a>              
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
};

/** Render list of deals
 *
 * @param  {Array} deals
 */
const renderDeals = (deals) => {
  sectionDeals.innerHTML = "";

  const fragment = document.createDocumentFragment();
  const div = document.createElement("div");
  const template = deals.map((deal) => createDealTemplate(deal)).join("");

  div.classList.add("row", "items", "overflow-auto");
  div.innerHTML = template;
  fragment.appendChild(div);
  sectionDeals.appendChild(fragment);

  // Attach listener to the favorite buttons
  document.querySelectorAll(".favorite-btn").forEach((button) => {
    button.addEventListener("click", toggleFavorite);
  });
};

const createSaleTemplate = (
  sale,
  profitability,
  legoId = undefined,
  modal = false
) => {
  return `
    <div class="col-4">
      <div class="card mb-4" id=${sale.uuid}">
        <div class="card-body d-block">
          <div class="row justify-content-between">
            <div class="col" style="width: 37%; flex: 0 0 auto;">
              <img class="img-fluid img-thumbnail" src="https://placehold.jp/1000x1000.png">
            </div>
            <div class="col ${modal ? "px-0" : ""}">
              <a href="${sale.link}" target="_blank"">
                <h5 class="card-title clamp-2-lines" ${
                  modal ? 'style= "height: 3rem !important;"' : ""
                }>${sale.title}</h5>
              </a>
              <h6 class="card-subtitle mb-2 text-muted" style="display: ${
                modal ? "none" : "block"
              };">${legoId}</h6>
              <p class="badge rounded-pill text-bg-info mb-0">${profitability}%</p>
              <p class="card-text mb-0" id="sale-price">${formatPrice(
                sale.price
              )}</p>
            </div>
            <div class="col px-0 ms-2" style="width: ${
              modal ? 9 : 7
            }%; flex: 0 0 auto;">
              <button class="btn favorite-btn mt-1" style="width: fit-content; display: none;" data-id="${
                sale.uuid
              }">
                ${ADD_FAV_ICON}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
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
      .map((sale) =>
        createSaleTemplate(
          sale,
          findHighestProfitability(allDeals, {
            legoId: legoId,
            price: sale.price,
          }),
          legoId
        )
      )
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

/** Create pagination button
 *
 * @param {*} page
 * @param {*} disabled
 * @param {*} icon
 * @param {*} ariaLabel
 * @returns
 */
const createPaginationButton = (
  page,
  disabled,
  icon,
  ariaLabel,
  newClass = "disabled"
) => `
  <li class="page-item ${disabled ? newClass : ""}">
    <a class="page-link" href="#" data-page="${page}" aria-label="${ariaLabel}">
      ${icon}
    </a>
  </li>
`;

/** Render pagination using Bootstrap
 *
 * @param  {Object} pagination
 */
const renderPagination = (pagination) => {
  const { currentPage, pageCount } = pagination;
  const paginationContainer = document.querySelector(".pagination");

  paginationContainer.innerHTML = ""; // Clear previous pagination

  // Feature 1 - Browse pages
  // Previous button
  paginationContainer.innerHTML += createPaginationButton(
    currentPage - 1,
    currentPage === 1,
    `<i class="fi fi-rr-caret-left"></i>`,
    "Previous"
  );

  // Page numbers
  for (let page = 1; page <= pageCount; page++) {
    paginationContainer.innerHTML += createPaginationButton(
      page,
      page === currentPage,
      page,
      "",
      "active"
    );
  }

  // Next button
  paginationContainer.innerHTML += createPaginationButton(
    currentPage + 1,
    currentPage === pageCount,
    `<i class="fi fi-rr-caret-right"></i>`,
    "Next"
  );

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

/** Set global deals and pagination data
 *
 * @param {Array} result - deals to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentDeals = ({ result, meta }) => {
  currentDeals = result;
  currentPagination = meta;
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

/** Render page selector
 *
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
    spanP25Price.innerHTML = `${formatPrice(
      calcQuartile(currentSales, 25).toFixed(2)
    )}`;
    spanP50Price.innerHTML = `${formatPrice(
      calcQuartile(currentSales, 50).toFixed(2)
    )}`;
    spanP95Price.innerHTML = `${formatPrice(
      calcQuartile(currentSales, 95).toFixed(2)
    )}`;
  } else {
    spanAvgPrice.innerHTML = "NaN";
    spanP95Price.innerHTML = "NaN";
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

/** Utility function for rendering paginated deals
 *
 * @param {*} deals
 */
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

/**
 * Handle filters
 */
const handleFilterClick = async (event) => {
  const filterOption = event.target;
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
  renderPaginatedDeals(filteredDeals);
};

filters.querySelectorAll("span").forEach((filterOption) => {
  filterOption.addEventListener("click", handleFilterClick);
});

/**
 * Handle sort change
 */
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

// Add event listener to deal titles to open modal and populate with data
document.addEventListener("click", async (event) => {
  console.log(`Event target: ${event.target.outerHTML}`);
  if (event.target.parentElement.classList.contains("deal-title")) {
    const uuid = event.target.parentElement.getAttribute("data-uuid");

    // Find the deal information
    const deal = currentDeals.find((deal) => deal.uuid === uuid);

    // Configure "See Deal" button
    document
      .getElementsByClassName("modal-footer")[0]
      // .getElementsByTagName("button")[0]
      .getElementsByTagName("a")[1]
      .setAttribute("href", deal.link);

    // Populate deal info in the modal
    const modalDealInfo = document.getElementById("modalDealInfo");
    modalDealInfo.innerHTML = `
      <div class="row">
        <div class="col-md-3">
          <img class="rounded img-fluid" src=${deal.photo} alt="${
      deal.uuid
    }-img"/>
        </div>
        <div class="col">
          <strong><h5>${deal.title}</h5></strong>
          <p>LEGO ID: ${deal.id}</p>
          <p>Temperature: ${deal.temperature}°</p>
          <p>Comments: ${deal.comments}</p>
          <p>Retail Price: ${formatPrice(deal.retail)}</p>
          <p>Discounted Price: ${formatPrice(deal.price)}</p>
          <p>Publication Date: ${new Date(
            deal.published * 1e3
          ).toLocaleDateString()}</p>
        </div>
      </div>
    `;

    // Fetch sales information for the LEGO ID
    let sales = await fetchSales(deal.id);
    const { average, p25, p50, p95 } = calculateSalesIndicators(sales);

    // Generate histogram data
    const { labels, histogram } = generateHistogramData(sales);

    // Get top 5 most rentable sales
    sales = sales
      .sort((a, b) => getProfitability(deal, b) - getProfitability(deal, a))
      .slice(0, 5);

    // Populate sales info in the modal
    const modalSalesInfo = document.getElementById("modalSalesInfo");
    modalSalesInfo.innerHTML = sales
      .map((sale) =>
        createSaleTemplate(sale, getProfitability(deal, sale), deal.id, true)
      )
      .join("");

    // Destroy canvas if it already exists
    const chartStatus = Chart.getChart("salesDistributionChart");
    if (chartStatus !== undefined) {
      chartStatus.destroy();
    }

    // Get the canvas element
    const canvas = document.getElementById("salesDistributionChart");
    const ctx = canvas.getContext("2d");

    // Create the chart
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Number of sales",
            data: histogram,
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        scales: {
          x: {
            beginAtZero: true,
            title: { display: true, text: "Price Ranges" },
          },
          y: { beginAtZero: true, title: { display: true, text: "Frequency" } },
        },
        plugins: {
          annotation: {
            annotations: [
              {
                type: "line",
                mode: "vertical",
                scaleID: "x",
                value: average.toFixed(2),
                borderColor: "orange",
                borderWidth: 2,
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                label: {
                  enabled: true,
                  content: "Average",
                  coolor: "red",
                },
              },
              {
                type: "line",
                mode: "vertical",
                scaleID: "x",
                value: p25.toFixed(2),
                borderColor: "red",
                borderWidth: 2,
                label: {
                  enabled: true,
                  content: "25th Percentile",
                },
              },
              {
                type: "line",
                mode: "vertical",
                scaleID: "x",
                value: p50.toFixed(2),
                borderColor: "green",
                borderWidth: 2,
                label: {
                  content: "50th Percentile",
                  position: "center",
                },
              },
              {
                type: "line",
                mode: "vertical",
                scaleID: "x",
                value: p95.toFixed(2),
                borderColor: "blue",
                borderWidth: 2,
                label: {
                  content: "95th Percentile",
                  enabled: true,
                  position: "top",
                },
              },
            ],
          },
          legend: {
            display: true,
            labels: {
              color: "black",
              font: {
                size: 12,
              },
              generateLabels: function (chart) {
                return [
                  {
                    text: `Average: ${formatPrice(average.toFixed(2))}`,
                    fillStyle: "orange",
                    hidden: false,
                  },
                  {
                    text: `25th Percentile: ${formatPrice(p25.toFixed(2))}`,
                    fillStyle: "red",
                    hidden: false,
                  },
                  {
                    text: `50th Percentile: ${formatPrice(p50.toFixed(2))}`,
                    fillStyle: "green",
                    hidden: false,
                  },
                  {
                    text: `95th Percentile: ${formatPrice(p95.toFixed(2))}`,
                    fillStyle: "blue",
                    hidden: false,
                  },
                ];
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Frequency: ${context.raw}`;
              },
            },
          },
        },
      },
    });
  }
});

/**
 * Handle page load and initial fetch
 */
document.addEventListener("DOMContentLoaded", async () => {
  const deals = await fetchDeals();

  setCurrentDeals(deals);
  render(currentDeals, currentPagination);
});
