```javascript
/*
 * ==========================================
 * BIGA GROUP QUOTATION SYSTEM
 * ==========================================
 */


/*
 * GOOGLE APPS SCRIPT WEB APP URL
 */
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz1_mTRognoC0yTc3ZzkYB9r-YiDq6qkSg1QoUou5BJJcbXnuZKoyabneY11pEPhIkcUA/exec";


/*
 * PRODUCT TABLE
 */
const rows =
  document.getElementById("productRows");


/*
 * QUOTATION DATE
 */
const quoteDate =
  document.getElementById("quoteDate");

if (quoteDate) {

  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(today.getMonth() + 1)
      .padStart(2, "0");

  const day =
    String(today.getDate())
      .padStart(2, "0");

  quoteDate.value =
    `${year}-${month}-${day}`;
}


/*
 * ==========================================
 * GOOGLE APPS SCRIPT JSONP
 * ==========================================
 *
 * GitHub Pages cannot directly use
 * google.script.run.
 *
 * JSONP allows this GitHub page to request
 * customer information and quote numbers
 * from Google Apps Script.
 */
function googleJSONP(action) {

  return new Promise((resolve, reject) => {

    const callbackName =
      "googleCallback_" +
      Date.now() +
      "_" +
      Math.floor(
        Math.random() * 10000
      );


    const script =
      document.createElement("script");


    const timeout =
      setTimeout(() => {

        cleanup();

        reject(
          new Error(
            "Google Apps Script request timed out."
          )
        );

      }, 15000);


    function cleanup() {

      clearTimeout(timeout);

      delete window[callbackName];

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }


    window[callbackName] =
      function(data) {

        cleanup();

        resolve(data);
      };


    script.onerror =
      function() {

        cleanup();

        reject(
          new Error(
            "Unable to connect to Google Apps Script."
          )
        );
      };


    script.src =
      GOOGLE_SCRIPT_URL +
      "?action=" +
      encodeURIComponent(action) +
      "&callback=" +
      encodeURIComponent(callbackName);


    document.body.appendChild(script);
  });
}


/*
 * ==========================================
 * LOAD CUSTOMERS
 * ==========================================
 */
async function loadCustomers() {

  const select =
    document.getElementById(
      "customerName"
    );


  if (!select) {
    return;
  }


  /*
   * Show loading status.
   */
  select.innerHTML =
    '<option value="">Loading customers...</option>';


  try {

    const customers =
      await googleJSONP(
        "customers"
      );


    /*
     * Clear dropdown.
     */
    select.innerHTML =
      '<option value="">Select customer</option>';


    /*
     * Add customers from Google Sheet.
     */
    customers.forEach(customer => {

      const option =
        document.createElement("option");


      /*
       * Customer ID is kept as
       * the option value.
       */
      option.value =
        customer.id;


      /*
       * Company name shown to user.
       */
      option.textContent =
        customer.company;


      /*
       * Store customer information
       * inside the option.
       */
      option.dataset.address =
        customer.address || "";

      option.dataset.email =
        customer.email || "";

      option.dataset.phone =
        customer.phone || "";


      select.appendChild(option);
    });


  } catch (error) {

    console.error(
      "Customer loading error:",
      error
    );


    select.innerHTML =
      '<option value="">Unable to load customers</option>';
  }
}


/*
 * ==========================================
 * CUSTOMER SELECTION
 * ==========================================
 */
function customerSelected() {

  const select =
    document.getElementById(
      "customerName"
    );


  if (!select) {
    return;
  }


  const option =
    select.options[
      select.selectedIndex
    ];


  /*
   * Nothing selected.
   */
  if (
    !option ||
    !option.value
  ) {

    const company =
      document.getElementById(
        "customerCompany"
      );

    const email =
      document.getElementById(
        "customerEmail"
      );

    const phone =
      document.getElementById(
        "customerPhone"
      );


    if (company) {
      company.value = "";
    }

    if (email) {
      email.value = "";
    }

    if (phone) {
      phone.value = "";
    }

    return;
  }


  /*
   * Fill company.
   */
  const company =
    document.getElementById(
      "customerCompany"
    );

  if (company) {

    company.value =
      option.textContent;
  }


  /*
   * Fill email.
   */
  const email =
    document.getElementById(
      "customerEmail"
    );

  if (email) {

    email.value =
      option.dataset.email || "";
  }


  /*
   * Fill phone.
   */
  const phone =
    document.getElementById(
      "customerPhone"
    );

  if (phone) {

    phone.value =
      option.dataset.phone || "";
  }
}


/*
 * ==========================================
 * GET NEXT QUOTE NUMBER
 * ==========================================
 */
async function loadQuoteNumber() {

  const quoteNumber =
    document.getElementById(
      "quoteNumber"
    );


  if (!quoteNumber) {
    return;
  }


  /*
   * Show temporary status.
   */
  quoteNumber.value =
    "Generating...";


  try {

    const result =
      await googleJSONP(
        "quoteNumber"
      );


    if (
      result &&
      result.quoteNumber
    ) {

      quoteNumber.value =
        result.quoteNumber;

    } else {

      quoteNumber.value =
        "ERROR";
    }


  } catch (error) {

    console.error(
      "Quote number error:",
      error
    );


    quoteNumber.value =
      "ERROR";
  }
}


/*
 * ==========================================
 * ADD PRODUCT ROW
 * ==========================================
 */
function addRow(
  item = "",
  note = "",
  qty = 1,
  price = 0
) {

  const tr =
    document.createElement("tr");


  tr.innerHTML = `
    <td class="row-number"></td>

    <td>
      <input
        class="item"
        placeholder="Product name">
    </td>

    <td>
      <input
        class="note"
        placeholder="Description">
    </td>

    <td>
      <input
        class="qty"
        type="number"
        min="0"
        step="1">
    </td>

    <td>
      <input
        class="price"
        type="number"
        min="0"
        step="0.01">
    </td>

    <td class="row-total">
      $0.00
    </td>

    <td class="no-print">
      <button
        type="button"
        class="remove">
        Remove
      </button>
    </td>
  `;


  /*
   * Set initial values.
   */
  tr.querySelector(".item").value =
    item;

  tr.querySelector(".note").value =
    note;

  tr.querySelector(".qty").value =
    qty;

  tr.querySelector(".price").value =
    price;


  /*
   * Remove row.
   */
  tr.querySelector(
    ".remove"
  ).addEventListener(
    "click",
    () => {

      tr.remove();

      renumberRows();

      calculateTotal();
    }
  );


  /*
   * Recalculate when quantity
   * or price changes.
   */
  tr.querySelectorAll(
    ".qty, .price"
  ).forEach(input => {

    input.addEventListener(
      "input",
      calculateTotal
    );
  });


  rows.appendChild(tr);


  renumberRows();

  calculateTotal();
}


/*
 * ==========================================
 * NUMBER PRODUCT ROWS
 * ==========================================
 */
function renumberRows() {

  [
    ...rows.children
  ].forEach(
    (tr, index) => {

      tr.querySelector(
        ".row-number"
      ).textContent =
        index + 1;
    }
  );
}


/*
 * ==========================================
 * CALCULATE TOTAL
 * ==========================================
 */
function calculateTotal() {

  const currencyElement =
    document.getElementById(
      "currency"
    );


  if (!currencyElement) {
    return;
  }


  const currency =
    currencyElement.value;


  const formatter =
    new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: currency
      }
    );


  let grandTotal = 0;


  [
    ...rows.children
  ].forEach(tr => {

    const qty =
      parseFloat(
        tr.querySelector(
          ".qty"
        ).value
      ) || 0;


    const price =
      parseFloat(
        tr.querySelector(
          ".price"
        ).value
      ) || 0;


    const total =
      qty * price;


    tr.querySelector(
      ".row-total"
    ).textContent =
      formatter.format(total);


    grandTotal +=
      total;
  });


  const totalElement =
    document.getElementById(
      "grandTotal"
    );


  if (totalElement) {

    totalElement.textContent =
      formatter.format(
        grandTotal
      );
  }
}


/*
 * ==========================================
 * INITIALIZE QUOTATION
 * ==========================================
 */
document.addEventListener(
  "DOMContentLoaded",
  function() {

    /*
     * Load customers from Google Sheet.
     */
    loadCustomers();


    /*
     * Generate quote number.
     */
    loadQuoteNumber();


    /*
     * Customer dropdown.
     */
    const customerSelect =
      document.getElementById(
        "customerName"
      );


    if (customerSelect) {

      customerSelect.addEventListener(
        "change",
        customerSelected
      );
    }


    /*
     * Currency changes.
     */
    const currency =
      document.getElementById(
        "currency"
      );


    if (currency) {

      currency.addEventListener(
        "change",
        calculateTotal
      );
    }
  }
);


/*
 * ==========================================
 * STARTING PRODUCT
 * ==========================================
 */
addRow(
  "Shower Gel",
  "",
  10000,
  0.15
);
```
