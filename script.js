"use strict";

/*
  Google Apps Script Web App
*/
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz1_mTRognoC0yTc3ZzkYB9r-YiDq6qkSg1QoUou5BJJcbXnuZKoyabneY11pEPhIkcUA/exec";


/* =========================================================
   GOOGLE APPS SCRIPT JSONP
   ========================================================= */

function googleJSONP(action) {

  return new Promise(function(resolve, reject) {

    const callbackName =
      "bigA_callback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);

    const script = document.createElement("script");

    let finished = false;

    const timeout = setTimeout(function() {

      if (finished) return;

      finished = true;

      cleanup();

      reject(
        new Error("Google Apps Script request timed out.")
      );

    }, 15000);


    function cleanup() {

      clearTimeout(timeout);

      try {
        delete window[callbackName];
      } catch (error) {
        window[callbackName] = undefined;
      }

      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    }


    window[callbackName] = function(data) {

      if (finished) return;

      finished = true;

      cleanup();

      resolve(data);
    };


    script.onerror = function() {

      if (finished) return;

      finished = true;

      cleanup();

      reject(
        new Error("Could not connect to Google Apps Script.")
      );
    };


    script.src =
      GOOGLE_SCRIPT_URL +
      "?action=" +
      encodeURIComponent(action) +
      "&callback=" +
      encodeURIComponent(callbackName) +
      "&_=" +
      Date.now();


    document.head.appendChild(script);

  });

}


/* =========================================================
   CUSTOMER LIST
   ========================================================= */

async function loadCustomers() {

  const customerSelect =
    document.getElementById("customerName");

  if (!customerSelect) {
    console.error("customerName not found.");
    return;
  }


  customerSelect.innerHTML =
    '<option value="">Loading customers...</option>';


  try {

    const customers =
      await googleJSONP("customers");

    console.log("Customers from Google:", customers);


    if (!Array.isArray(customers)) {
      throw new Error("Invalid customer response.");
    }


    customerSelect.innerHTML =
      '<option value="">Select customer</option>';


    customers.forEach(function(customer) {

      const option =
        document.createElement("option");


      option.value =
        customer.id || customer.company || "";


      option.textContent =
        customer.company || "Unnamed customer";


      option.dataset.email =
        customer.email || "";


      option.dataset.phone =
        customer.phone || "";


      option.dataset.address =
        customer.address || "";


      customerSelect.appendChild(option);

    });


    if (customers.length === 0) {

      customerSelect.innerHTML =
        '<option value="">No customers found</option>';

    }

  } catch (error) {

    console.error(
      "Customer loading error:",
      error
    );


    customerSelect.innerHTML =
      '<option value="">Unable to load customers</option>';

  }

}


/* =========================================================
   CUSTOMER SELECTED
   ========================================================= */

function customerSelected() {

  const select =
    document.getElementById("customerName");

  const company =
    document.getElementById("customerCompany");

  const email =
    document.getElementById("customerEmail");

  const phone =
    document.getElementById("customerPhone");


  if (!select) return;


  const option =
    select.options[select.selectedIndex];


  if (!option || !option.value) {

    company.value = "";
    email.value = "";
    phone.value = "";

    return;
  }


  company.value =
    option.textContent || "";


  email.value =
    option.dataset.email || "";


  phone.value =
    option.dataset.phone || "";

}


/* =========================================================
   QUOTE NUMBER
   ========================================================= */

async function loadQuoteNumber() {

  const quoteNumber =
    document.getElementById("quoteNumber");


  if (!quoteNumber) return;


  quoteNumber.value = "Generating...";


  try {

    const result =
      await googleJSONP("quoteNumber");


    console.log(
      "Quote number:",
      result
    );


    if (
      !result ||
      !result.quoteNumber
    ) {
      throw new Error(
        "No quote number returned."
      );
    }


    quoteNumber.value =
      result.quoteNumber;


  } catch (error) {

    console.error(
      "Quote number error:",
      error
    );


    quoteNumber.value =
      "Error";

  }

}


/* =========================================================
   ADD PRODUCT ROW
   ========================================================= */

function addRow(
  item = "",
  note = "",
  qty = 1,
  price = 0
) {

  const rows =
    document.getElementById("productRows");


  if (!rows) {

    console.error(
      "productRows not found."
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
        type="text"
        placeholder="Product name"
      >
    </td>

    <td>
      <input
        class="note"
        type="text"
        placeholder="Description"
      >
    </td>

    <td>
      <input
        class="qty"
        type="number"
        min="0"
        step="1"
      >
    </td>

    <td>
      <input
        class="price"
        type="number"
        min="0"
        step="0.01"
      >
    </td>

    <td class="row-total">
      $0.00
    </td>

    <td class="no-print">

      <button
        type="button"
        class="remove"
      >
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


  tr.querySelector(".remove")
    .addEventListener(
      "click",
      function() {

        tr.remove();

        renumberRows();

        calculateTotal();

      }
    );


  tr.querySelector(".qty")
    .addEventListener(
      "input",
      calculateTotal
    );


  tr.querySelector(".price")
    .addEventListener(
      "input",
      calculateTotal
    );


  rows.appendChild(tr);


  renumberRows();

  calculateTotal();

}


/* =========================================================
   NUMBER PRODUCT ROWS
   ========================================================= */

function renumberRows() {

  const rows =
    document.getElementById("productRows");


  if (!rows) return;


  Array.from(rows.children)
    .forEach(function(tr, index) {

      const number =
        tr.querySelector(".row-number");


      if (number) {

        number.textContent =
          index + 1;

      }

    });

}


/* =========================================================
   CALCULATE TOTAL
   ========================================================= */

function calculateTotal() {

  const rows =
    document.getElementById("productRows");


  const currency =
    document.getElementById("currency");


  const grandTotal =
    document.getElementById("grandTotal");


  if (
    !rows ||
    !currency ||
    !grandTotal
  ) {
    return;
  }


  const formatter =
    new Intl.NumberFormat(
      "en-US",
      {
        style: "currency",
        currency: currency.value
      }
    );


  let totalAmount = 0;


  Array.from(rows.children)
    .forEach(function(tr) {

      const qty =
        parseFloat(
          tr.querySelector(".qty").value
        ) || 0;


      const price =
        parseFloat(
          tr.querySelector(".price").value
        ) || 0;


      const total =
        qty * price;


      const rowTotal =
        tr.querySelector(".row-total");


      rowTotal.textContent =
        formatter.format(total);


      totalAmount += total;

    });


  grandTotal.textContent =
    formatter.format(totalAmount);

}


/* =========================================================
   DATES
   ========================================================= */

function setDates() {

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


  const todayString =
    `${year}-${month}-${day}`;


  const quoteDate =
    document.getElementById(
      "quoteDate"
    );


  const validUntil =
    document.getElementById(
      "validUntil"
    );


  if (quoteDate) {

    quoteDate.value =
      todayString;

  }


  if (validUntil) {

    const future =
      new Date();


    future.setDate(
      future.getDate() + 30
    );


    const futureYear =
      future.getFullYear();


    const futureMonth =
      String(
        future.getMonth() + 1
      ).padStart(2, "0");


    const futureDay =
      String(
        future.getDate()
      ).padStart(2, "0");


    validUntil.value =
      `${futureYear}-${futureMonth}-${futureDay}`;

  }

}


/* =========================================================
   START APPLICATION
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    console.log(
      "BigA Group quotation system started."
    );


    setDates();


    /*
      THIS ROW MUST APPEAR
      EVEN IF GOOGLE IS DOWN.
    */
    addRow(
      "Shower Gel",
      "",
      10000,
      0.15
    );


    const addProductButton =
      document.getElementById(
        "addProductBtn"
      );


    if (addProductButton) {

      addProductButton.addEventListener(
        "click",
        function() {

          addRow();

        }
      );

    }


    const printButton =
      document.getElementById(
        "printBtn"
      );


    if (printButton) {

      printButton.addEventListener(
        "click",
        function() {

          window.print();

        }
      );

    }


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
      Google functions are separate.
      They cannot prevent the product
      table from appearing.
    */

    loadCustomers();

    loadQuoteNumber();

  }
);
