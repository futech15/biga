
<script>

// ==========================================
// BIGA GROUP QUOTATION SYSTEM
// ==========================================

const rows = document.getElementById("productRows");

const quoteDate =
  document.getElementById("quoteDate");

const customerSelect =
  document.getElementById("customerSelect");

let customers = [];

let selectedCustomerID = "";


// ==========================================
// INITIALIZATION
// ==========================================

function initializeApp() {

  const today = new Date();

  quoteDate.value =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");

  loadCustomers();

  // Begin with one empty product.
  addRow();

}


// ==========================================
// LOAD SAVED CUSTOMERS
// ==========================================

function loadCustomers(selectID = "") {

  customerSelect.innerHTML =
    '<option value="">Loading customers...</option>';

  google.script.run
    .withSuccessHandler(function(data) {

      customers = data;

      customerSelect.innerHTML =
        '<option value="">Select a customer</option>';

      customers.forEach(function(customer) {

        const option =
          document.createElement("option");

        option.value = customer.id;

        option.textContent =
          customer.company;

        customerSelect.appendChild(option);

      });

      if (selectID) {
        customerSelect.value = selectID;
        selectCustomer();
      }

    })
    .withFailureHandler(function(error) {

      customerSelect.innerHTML =
        '<option value="">Unable to load customers</option>';

      alert(error.message);

    })
    .getCustomers();

}


// ==========================================
// SELECT EXISTING CUSTOMER
// ==========================================

function selectCustomer() {

  const id = customerSelect.value;

  selectedCustomerID = id;

  const customer = customers.find(
    item => item.id === id
  );

  if (!customer) {
    return;
  }

  document.getElementById("customer").value =
    customer.company;

  document.getElementById("address").value =
    customer.address;

  document.getElementById("email").value =
    customer.email;

  document.getElementById("phone").value =
    customer.phone;

}


// ==========================================
// SHOW / HIDE NEW CUSTOMER FORM
// ==========================================

function toggleCustomerForm() {

  const form =
    document.getElementById("newCustomerForm");

  form.hidden = !form.hidden;

}


// ==========================================
// SAVE NEW CUSTOMER
// ==========================================

function saveCustomer() {

  const customer = {

    company:
      document.getElementById("newCompany")
        .value.trim(),

    address:
      document.getElementById("newAddress")
        .value.trim(),

    email:
      document.getElementById("newEmail")
        .value.trim(),

    phone:
      document.getElementById("newPhone")
        .value.trim()

  };

  if (!customer.company) {
    alert("Please enter a company name.");
    return;
  }

  const message =
    document.getElementById("customerMessage");

  message.textContent = "Saving customer...";

  google.script.run
    .withSuccessHandler(function(result) {

      message.textContent =
        "Customer saved successfully.";

      loadCustomers(result.id);

      document.getElementById(
        "newCustomerForm"
      ).hidden = true;

      document.getElementById(
        "newCompany"
      ).value = "";

      document.getElementById(
        "newAddress"
      ).value = "";

      document.getElementById(
        "newEmail"
      ).value = "";

      document.getElementById(
        "newPhone"
      ).value = "";

    })
    .withFailureHandler(function(error) {

      message.textContent =
        "Error: " + error.message;

    })
    .addCustomer(customer);

}


// ==========================================
// ADD PRODUCT ROW
// ==========================================

function addRow(
  item = "",
  note = "",
  qty = 1,
  price = 0
) {

  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="row-number"></td>

    <td>
      <input class="item"
             placeholder="Product name">
    </td>

    <td>
      <input class="note"
             placeholder="Description">
    </td>

    <td>
      <input class="qty"
             type="number"
             min="0"
             step="1">
    </td>

    <td>
      <input class="price"
             type="number"
             min="0"
             step="0.01">
    </td>

    <td class="row-total">$0.00</td>

    <td class="no-print">
      <button type="button"
              class="remove">
        Remove
      </button>
    </td>
  `;

  tr.querySelector(".item").value = item;

  tr.querySelector(".note").value = note;

  tr.querySelector(".qty").value = qty;

  tr.querySelector(".price").value = price;


  // Remove product.
  tr.querySelector(".remove")
    .addEventListener("click", function() {

      tr.remove();

      renumberRows();

      calculateTotal();

    });


  // Recalculate when quantity or price changes.
  tr.querySelectorAll(".qty, .price")
    .forEach(function(input) {

      input.addEventListener(
        "input",
        calculateTotal
      );

    });


  rows.appendChild(tr);

  renumberRows();

  calculateTotal();

}


// ==========================================
// RENUMBER PRODUCT ROWS
// ==========================================

function renumberRows() {

  [...rows.children].forEach(
    function(tr, index) {

      tr.querySelector(
        ".row-number"
      ).textContent = index + 1;

    }
  );

}


// ==========================================
// CALCULATE TOTALS
// ==========================================

function calculateTotal() {

  const currency =
    document.getElementById(
      "currency"
    ).value;

  const formatter =
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency
    });

  let grandTotal = 0;

  [...rows.children].forEach(function(tr) {

    const qty =
      parseFloat(
        tr.querySelector(".qty").value
      ) || 0;

    const price =
      parseFloat(
        tr.querySelector(".price").value
      ) || 0;

    const total = qty * price;

    tr.querySelector(
      ".row-total"
    ).textContent = formatter.format(total);

    grandTotal += total;

  });

  document.getElementById(
    "grandTotal"
  ).textContent = formatter.format(grandTotal);

}


// ==========================================
// START APPLICATION
// ==========================================

initializeApp();

</script>
