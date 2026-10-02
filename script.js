"use strict";


/*
=========================================================
GOOGLE APPS SCRIPT WEB APP
=========================================================
*/

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbz1_mTRognoC0yTc3ZzkYB9r-YiDq6qkSg1QoUou5BJJcbXnuZKoyabneY11pEPhIkcUA/exec";



/*
=========================================================
GOOGLE APPS SCRIPT JSONP
=========================================================
*/

function googleJSONP(action, params = {}) {

  return new Promise(function(resolve, reject) {

    const callbackName =
      "bigA_callback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 100000);


    const script =
      document.createElement("script");


    let finished = false;


    const timeout =
      setTimeout(function() {

        if (finished) return;

        finished = true;

        cleanup();

        reject(
          new Error(
            "Google Apps Script request timed out."
          )
        );

      }, 30000);


    function cleanup() {

      clearTimeout(timeout);


      try {

        delete window[callbackName];

      } catch (error) {

        window[callbackName] =
          undefined;

      }


      if (script.parentNode) {

        script.parentNode
          .removeChild(script);

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


    let url =
      GOOGLE_SCRIPT_URL +
      "?action=" +
      encodeURIComponent(action) +
      "&callback=" +
      encodeURIComponent(callbackName);


    Object.keys(params)
      .forEach(function(key) {

        url +=
          "&" +
          encodeURIComponent(key) +
          "=" +
          encodeURIComponent(
            params[key]
          );

      });


    url +=
      "&_=" +
      Date.now();


    script.src = url;

    document.head.appendChild(script);

  });

}



/*
=========================================================
CUSTOMER LIST
=========================================================
*/

async function loadCustomers() {

  const customerSelect =
    document.getElementById(
      "customerName"
    );


  if (!customerSelect) {

    console.error(
      "customerName not found."
    );

    return;

  }


  customerSelect.innerHTML =
    '<option value="">Loading customers...</option>';


  try {

    const customers =
      await googleJSONP(
        "customers"
      );


    console.log(
      "Customers from Google:",
      customers
    );


    if (!Array.isArray(customers)) {

      throw new Error(
        "Invalid customer response."
      );

    }


    customerSelect.innerHTML =
      '<option value="">Select customer</option>';


    customers.forEach(
      function(customer) {

        const option =
          document.createElement(
            "option"
          );


        option.value =
          customer.id ||
          customer.company ||
          "";


        option.textContent =
          customer.company ||
          "Unnamed customer";


        option.dataset.email =
          customer.email ||
          "";


        option.dataset.phone =
          customer.phone ||
          "";


        option.dataset.address =
          customer.address ||
          "";


        customerSelect.appendChild(
          option
        );

      }
    );


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



/*
=========================================================
CUSTOMER SELECTED
=========================================================
*/

function customerSelected() {

  const select =
    document.getElementById(
      "customerName"
    );


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


  if (!select) return;


  const option =
    select.options[
      select.selectedIndex
    ];


  if (
    !option ||
    !option.value
  ) {

    company.value = "";

    email.value = "";

    phone.value = "";

    return;

  }


  company.value =
    option.textContent ||
    "";


  email.value =
    option.dataset.email ||
    "";


  phone.value =
    option.dataset.phone ||
    "";

}



/*
=========================================================
QUOTE NUMBER
=========================================================
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



/*
=========================================================
ADD PRODUCT ROW
=========================================================
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
      "productRows not found."
    );

    return;

  }


  const tr =
    document.createElement(
      "tr"
    );


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


  tr.querySelector(
    ".item"
  ).value =
    item;


  tr.querySelector(
    ".note"
  ).value =
    note;


  tr.querySelector(
    ".qty"
  ).value =
    qty;


  tr.querySelector(
    ".price"
  ).value =
    price;



  tr.querySelector(
    ".remove"
  ).addEventListener(
    "click",
    function() {

      tr.remove();

      renumberRows();

      calculateTotal();

    }
  );



  tr.querySelector(
    ".qty"
  ).addEventListener(
    "input",
    calculateTotal
  );


  tr.querySelector(
    ".price"
  ).addEventListener(
    "input",
    calculateTotal
  );


  rows.appendChild(
    tr
  );


  renumberRows();

  calculateTotal();

}



/*
=========================================================
NUMBER PRODUCT ROWS
=========================================================
*/

function renumberRows() {

  const rows =
    document.getElementById(
      "productRows"
    );


  if (!rows) return;


  Array.from(
    rows.children
  )
    .forEach(
      function(tr, index) {

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
=========================================================
CALCULATE TOTAL
=========================================================
*/

function calculateTotal() {

  const rows =
    document.getElementById(
      "productRows"
    );


  const currency =
    document.getElementById(
      "currency"
    );


  const grandTotal =
    document.getElementById(
      "grandTotal"
    );


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
        currency:
          currency.value
      }
    );


  let totalAmount =
    0;


  Array.from(
    rows.children
  )
    .forEach(
      function(tr) {

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


        const rowTotal =
          tr.querySelector(
            ".row-total"
          );


        rowTotal.textContent =
          formatter.format(
            total
          );


        totalAmount +=
          total;

      }
    );


  grandTotal.textContent =
    formatter.format(
      totalAmount
    );

}



/*
=========================================================
DATES
=========================================================
*/

function setDates() {

  const today =
    new Date();


  const year =
    today.getFullYear();


  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      "0"
    );


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
      ).padStart(
        2,
        "0"
      );


    const futureDay =
      String(
        future.getDate()
      ).padStart(
        2,
        "0"
      );


    validUntil.value =
      `${futureYear}-${futureMonth}-${futureDay}`;

  }

}



/*
=========================================================
CREATE PDF HTML
=========================================================
*/

async function createQuotePDFHTML() {

  calculateTotal();


  const originalQuote =
    document.querySelector(
      ".quote"
    );


  if (!originalQuote) {

    throw new Error(
      "Quotation section was not found."
    );

  }


  /*
    Clone the quotation.
  */
  const quote =
    originalQuote.cloneNode(
      true
    );


  /*
    Remove buttons and other
    elements marked no-print.
  */
  quote
    .querySelectorAll(
      ".no-print"
    )
    .forEach(
      function(element) {

        element.remove();

      }
    );


  /*
    Convert form controls into
    normal printable text.
  */
  quote
    .querySelectorAll(
      "input, textarea, select"
    )
    .forEach(
      function(element) {

        let value =
          "";


        if (
          element.tagName ===
          "SELECT"
        ) {

          const selected =
            element.options[
              element.selectedIndex
            ];


          value =
            selected
              ? selected.textContent
              : "";

        } else {

          value =
            element.value || "";

        }


        const span =
          document.createElement(
            "span"
          );


        span.textContent =
          value;


        span.className =
          "print-field";


        span.style.display =
          "inline-block";


        span.style.boxSizing =
          "border-box";


        span.style.padding =
          "0";


        span.style.margin =
          "0";


        span.style.border =
          "none";


        span.style.background =
          "transparent";


        span.style.font =
          "inherit";


        element.replaceWith(
          span
        );

      }
    );


  /*
    Convert relative image paths
    to absolute URLs.
  */
  quote
    .querySelectorAll(
      "img"
    )
    .forEach(
      function(image) {

        const source =
          image.getAttribute(
            "src"
          );


        if (!source) return;


        try {

          image.src =
            new URL(
              source,
              window.location.href
            ).href;

        } catch (error) {

          console.warn(
            "Could not convert image URL:",
            error
          );

        }

      }
    );


  /*
    Load the current CSS.
  */
  const cssResponse =
    await fetch(
      "./style.css?v=" +
      Date.now()
    );


  if (!cssResponse.ok) {

    throw new Error(
      "Could not load style.css."
    );

  }


  const css =
    await cssResponse.text();


  /*
    Build complete HTML document.
  */
  const pdfHTML = `
<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8">

  <style>

    ${css}


    @page {
      size: A4;
      margin: 0;
    }


    html,
    body {

      margin: 0;

      padding: 0;

      background: white;

    }


    .toolbar,
    .no-print {

      display: none !important;

    }


    .quote {

      width: 210mm !important;

      min-height: 297mm !important;

      margin: 0 !important;

      padding: 18mm !important;

      box-shadow: none !important;

      background: white !important;

    }


    .print-field {

      color: #222;

    }


    .company-logo {

      display: block !important;

      width: 140px !important;

      height: 50px !important;

      max-width: 140px !important;

      max-height: 50px !important;

      object-fit: contain !important;

    }

  </style>

</head>


<body>

  ${quote.outerHTML}

</body>

</html>
`;


  return pdfHTML;

}



/*
=========================================================
SAVE QUOTE TO GOOGLE DRIVE
=========================================================
*/

async function saveQuoteToDrive() {

  const button =
    document.getElementById(
      "saveDriveBtn"
    );


  if (button) {

    button.disabled =
      true;


    button.textContent =
      "Saving...";

  }


  try {

    /*
      Create the printable
      quotation HTML.
    */
    const pdfHTML =
      await createQuotePDFHTML();


    /*
      Quote number.
    */
    const quoteNumber =
      document.getElementById(
        "quoteNumber"
      )?.value ||
      "Quote";


    /*
      Customer/company.
    */
    const customerCompany =
      document.getElementById(
        "customerCompany"
      )?.value ||
      "Customer";


    /*
      Clean filename.
    */
    const safeCustomer =
      customerCompany
        .trim()
        .replace(
          /[\\/:*?"<>|]/g,
          "-"
        )
        .replace(
          /\s+/g,
          " "
        );


    const fileName =
      "Quote-" +
      quoteNumber +
      "-" +
      safeCustomer +
      ".pdf";


    /*
      Create hidden iframe.
      Apps Script will send a message
      back when the file is created.
    */
    const iframe =
      document.createElement(
        "iframe"
      );


    iframe.style.display =
      "none";


    iframe.name =
      "bigA_save_frame_" +
      Date.now();


    document.body.appendChild(
      iframe
    );


    /*
      Listen for response from
      Apps Script.
    */
    const result =
      await new Promise(
        function(resolve, reject) {

          const timeout =
            setTimeout(
              function() {

                window.removeEventListener(
                  "message",
                  messageHandler
                );


                if (
                  iframe.parentNode
                ) {

                  iframe.parentNode
                    .removeChild(
                      iframe
                    );

                }


                reject(
                  new Error(
                    "Save to Drive timed out."
                  )
                );

              },
              60000
            );


          function messageHandler(
            event
          ) {

            if (
              !event.data ||
              event.data.source !==
                "BigAGroupQuote"
            ) {

              return;

            }


            clearTimeout(
              timeout
            );


            window.removeEventListener(
              "message",
              messageHandler
            );


            if (
              iframe.parentNode
            ) {

              iframe.parentNode
                .removeChild(
                  iframe
                );

            }


            resolve(
              event.data
            );

          }


          window.addEventListener(
            "message",
            messageHandler
          );


          /*
            Create POST form.
          */
          const form =
            document.createElement(
              "form"
            );


          form.method =
            "POST";


          form.action =
            GOOGLE_SCRIPT_URL;


          form.target =
            iframe.name;


          form.style.display =
            "none";


          /*
            Action.
          */
          const actionInput =
            document.createElement(
              "input"
            );


          actionInput.type =
            "hidden";


          actionInput.name =
            "action";


          actionInput.value =
            "saveQuote";


          form.appendChild(
            actionInput
          );


          /*
            Filename.
          */
          const fileNameInput =
            document.createElement(
              "input"
            );


          fileNameInput.type =
            "hidden";


          fileNameInput.name =
            "fileName";


          fileNameInput.value =
            fileName;


          form.appendChild(
            fileNameInput
          );


          /*
            HTML quotation.
          */
          const htmlInput =
            document.createElement(
              "input"
            );


          htmlInput.type =
            "hidden";


          htmlInput.name =
            "html";


          htmlInput.value =
            pdfHTML;


          form.appendChild(
            htmlInput
          );


          document.body.appendChild(
            form
          );


          form.submit();


          /*
            Remove form after submit.
          */
          setTimeout(
            function() {

              if (
                form.parentNode
              ) {

                form.parentNode
                  .removeChild(
                    form
                  );

              }

            },
            1000
          );

        }
      );


    if (
      !result.success
    ) {

      throw new Error(
        result.error ||
        "The quote could not be saved."
      );

    }


    alert(
      "Quote saved to Google Drive.\n\n" +
      result.fileName
    );


  } catch (error) {

    console.error(
      "Save to Drive error:",
      error
    );


    alert(
      "Could not save the quote to Google Drive.\n\n" +
      error.message
    );


  } finally {

    if (button) {

      button.disabled =
        false;


      button.textContent =
        "Save to Drive";

    }

  }

}



/*
=========================================================
START APPLICATION
=========================================================
*/

document.addEventListener(
  "DOMContentLoaded",
  function() {


    console.log(
      "BigA Group quotation system started."
    );


    /*
      Set dates.
    */
    setDates();


    /*
      Default product.
      This must appear even if
      Google is unavailable.
    */
    addRow(
      "Shower Gel",
      "",
      10000,
      0.15
    );


    /*
      ADD PRODUCT BUTTON
    */
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


    /*
      PRINT BUTTON
    */
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


    /*
      SAVE TO DRIVE BUTTON
    */
    const saveDriveButton =
      document.getElementById(
        "saveDriveBtn"
      );


    if (saveDriveButton) {

      saveDriveButton.addEventListener(
        "click",
        saveQuoteToDrive
      );

    }


    /*
      CURRENCY
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


    /*
      CUSTOMER SELECT
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
      GOOGLE FUNCTIONS
    */
    loadCustomers();

    loadQuoteNumber();

  }
);
