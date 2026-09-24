
const rows = document.getElementById("productRows");

const quoteDate = document.getElementById("quoteDate");
quoteDate.value = new Date().toLocaleDateString("en-CA");

function addRow(item = "", note = "", qty = 1, price = 0) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td class="row-number"></td>

    <td>
      <input class="item" placeholder="Product name">
    </td>

    <td>
      <input class="note" placeholder="Description">
    </td>

    <td>
      <input class="qty" type="number"
        min="0" step="1">
    </td>

    <td>
      <input class="price" type="number"
        min="0" step="0.01">
    </td>

    <td class="row-total">$0.00</td>

    <td class="no-print">
      <button type="button" class="remove">
        Remove
      </button>
    </td>
  `;

  tr.querySelector(".item").value = item;
  tr.querySelector(".note").value = note;
  tr.querySelector(".qty").value = qty;
  tr.querySelector(".price").value = price;

  tr.querySelector(".remove").addEventListener("click", () => {
    tr.remove();
    renumberRows();
    calculateTotal();
  });

  tr.querySelectorAll(".qty, .price").forEach(input => {
    input.addEventListener("input", calculateTotal);
  });

  rows.appendChild(tr);

  renumberRows();
  calculateTotal();
}

function renumberRows() {
  [...rows.children].forEach((tr, index) => {
    tr.querySelector(".row-number").textContent = index + 1;
  });
}

function calculateTotal() {
  const currency = document.getElementById("currency").value;

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency
  });

  let grandTotal = 0;

  [...rows.children].forEach(tr => {
    const qty = parseFloat(
      tr.querySelector(".qty").value
    ) || 0;

    const price = parseFloat(
      tr.querySelector(".price").value
    ) || 0;

    const total = qty * price;

    tr.querySelector(".row-total").textContent =
      formatter.format(total);

    grandTotal += total;
  });

  document.getElementById("grandTotal").textContent =
    formatter.format(grandTotal);
}

// Start with the product from your original quotation.
addRow("Shower Gel", "", 10000, 0.15);
