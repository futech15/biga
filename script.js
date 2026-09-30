```javascript
/*
 * ==========================================
 * BIGA GROUP QUOTATION SYSTEM
 * ==========================================
 */

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz1_mTRognoC0yTc3ZzkYB9r-YiDq6qkSg1QoUou5BJJcbXnuZKoyabneY11pEPhIkcUA/exec";


/*
 * ==========================================
 * GOOGLE APPS SCRIPT JSONP
 * ==========================================
 */

function googleJSONP(action) {

  return new Promise((resolve, reject) => {

    const callbackName =
      "googleCallback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);


    const script =
      document.createElement("script");


    let finished = false;


    const timeout =
      setTimeout(() => {

        if (finished) return;

        finished = true;

        cleanup();

        reject(
          new Error(
            "Google Apps Script request timed out."
          )
        );

      }, 15000);


    function cleanup() {

      clearTimeout(timeout);

      try {
        delete window[callbackName];
      } catch (e) {
        window[callbackName] = undefined;
      }

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }


    window[callbackName] =
      function(data) {

        if (finished) return;

        finished = true;

        cleanup();

        resolve(data);
      };


    script.onerror =
      function() {

        if (finished) return;

        finished = true;

        cleanup();

        reject(
          new Error(
            "Could not connect to Google Apps Script."
          )
        );
      };


    script.src =
      GOOGLE_SCRIPT_URL +
      "?action=" +
      encodeURIComponent(action) +
      "&callback=" +
      encodeURIComponent(callbackName) +
      "&t=" +
      Date.now();


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
    document.getElementById("customerName");


  if (!select) {
    console.error(
      "customerName element was not found."
    );

    return;
  }


  select.innerHTML =
    '<option value="">Loading customers...</option>';


  try {

    const customers =
      await googleJSONP("customers");


    console.log(
      "Customers received:",
      customers
    );


    if (!Array.isArray(customers)) {

      throw new Error(
        "Customer data is not an array."
      );
    }


    select.innerHTML =
      '<option value="">Select customer</option>';


    customers.forEach(customer => {

      const option =
        document.createElement("option");


      option.value =
        customer.id || "";


      option.textContent =
        customer.company || "Unnamed customer";


      option.dataset.address =
        customer.address || "";


      option.dataset.email =
        customer.email || "";


      option.dataset.phone =
        customer.phone || "";


      select.appendChild(option);
    });


    /*
     * If there are no customers,
     * show a useful message.
     */
    if (customers.length === 0) {

      select.innerHTML =
        '<option value="">No customers found</option>';
    }


  } catch (error) {

    console.error(
      "Customer loading failed:",
      error
    );


    select.innerHTML =
      '<option value="">Customer list unavailable</option>';
  }
}


/*
 * ==========================================
 * CUSTOMER SELECTED
 * ==========================================
 */

function customerSelected() {

  const select =
    document.getElementById(
      "customerName"
    );


  if (!select) return;


  const option =
    select.options[
      select.selectedIndex
    ];


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


  if (
    !option ||
    !option.value
  ) {

    if (company) company.value = "";

    if (email) email.value = "";

    if (phone) phone.value = "";

    return;
  }


  if (company) {

    company.value =
      option.textContent;
  }


  if (email) {

    email.value =
      option.dataset.email || "";
  }


  if (phone) {

    phone.value =
      option.dataset.phone || "";
  }
}


/*
 * ==========================================
 * GENERATE QUOTE NUMBER
 * ==========================================
 */

async function loadQuoteNumber() {

  const quoteNumber =
    document.getElementById(
      "quoteNumber"
    );


  if (!quoteNumber) return;


  quoteNumber.value =
    "Generating...";


  try {

    const result =
      await googleJSONP(
        "quoteNumber"
      );


    console.log(
      "Quote number received:",
      result
    );


    if (
      result &&
      result.quoteNumber
    ) {

      quoteNumber.value =
        result.quoteNumber;

    } else {

      throw new Error(
        "No quote number returned."
      );
    }


  } catch (error) {

    console.error(
      "Quote number failed:",
      error
    );


    quoteNumber.value =
      "Not available";
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

  const rows =
    document.getElementById(
      "productRows"
    );


  if (!rows) {

    console.error(
      "productRows element was not found."
    );

    return;
  }


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


  tr.querySelector(".item").value =
    item;


  tr.querySelector(".note").value =
    note;


  tr.querySelector(".qty").value =
    qty;


  tr.querySelector(".price").value =
    price;


  /*
   * Remove button.
   */
  tr.querySelector(".remove")
    .addEventListener(
      "click",
      function() {

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

  const rows =
    document.getElementById(
      "productRows"
    );


  if (!rows) return;


  [
    ...rows.children
  ].forEach(
    (tr, index) => {

      const number =
        tr.querySelector(
          ".row-number"
        );


      if (number) {

        number.textContent =
          index + 1;
      }
    }
  );
}


/*
 * ==========================================
 * CALCULATE TOTAL
 * ==========================================
 */

function calculateTotal() {

  const rows =
    document.getElementById(
      "productRows"
    );


  const currencyElement =
    document.getElementById(
      "currency"
    );


  const grandTotalElement =
    document.getElementById(
      "grandTotal"
    );


  if (
    !rows ||
    !currencyElement ||
    !grandTotalElement
  ) {

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

    const qtyElement =
      tr.querySelector(
        ".qty"
      );


    const priceElement =
      tr.querySelector(
        ".price"
      );


    const totalElement =
      tr.querySelector(
        ".row-total"
      );


    const qty =
      parseFloat(
        qtyElement.value
      ) || 0;


    const price =
      parseFloat(
        priceElement.value
      ) || 0;


    const total =
      qty * price;


    totalElement.textContent =
      formatter.format(total);


    grandTotal +=
      total;
  });


  grandTotalElement.textContent =
    formatter.format(
      grandTotal
    );
}


/*
 * ==========================================
 * SET TODAY'S DATE
 * ==========================================
 */

function setQuoteDate() {

  const quoteDate =
    document.getElementById(
      "quoteDate"
    );


  if (!quoteDate) return;


  const today =
    new Date();


  const year =
    today.getFullYear();


  const month =
    String(
      today.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      today.getDate()
    ).padStart(2, "0");


  quoteDate.value =
    `${year}-${month}-${day}`;
}


/*
 * ==========================================
 * INITIALIZE PAGE
 * ==========================================
 */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "BigA quotation system loaded."
    );


    /*
     * Set quotation date.
     */
    setQuoteDate();


    /*
     * Add the first product.
     */
    addRow(
      "Shower Gel",
      "",
      10000,
      0.15
    );


    /*
     * Load customers.
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
     * Currency.
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
```
