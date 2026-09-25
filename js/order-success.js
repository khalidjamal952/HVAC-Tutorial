// =========================================
// ORDER SUCCESS
// =========================================

const successOrderId = document.getElementById("successOrderId");

const successPayment = document.getElementById("successPayment");

const successTotal = document.getElementById("successTotal");

// =========================================
// GET ORDERS
// =========================================

const orders = JSON.parse(localStorage.getItem("hvacOrders")) || [];

// =========================================
// GET LAST ORDER
// =========================================

const lastOrder = orders.length > 0 ? orders[orders.length - 1] : null;

// =========================================
// DISPLAY ORDER
// =========================================

if (lastOrder) {
  if (successOrderId) {
    successOrderId.textContent = lastOrder.orderId;
  }

  if (successTotal) {
    successTotal.textContent = `₹${lastOrder.total}`;
  }

  if (successPayment) {
    let paymentName = "Online Payment";

    if (lastOrder.paymentMethod === "upi") {
      paymentName = "UPI";
    } else if (lastOrder.paymentMethod === "card") {
      paymentName = "Credit / Debit Card";
    } else if (lastOrder.paymentMethod === "netbanking") {
      paymentName = "Net Banking";
    } else if (lastOrder.paymentMethod === "wallet") {
      paymentName = "Wallet";
    }

    successPayment.textContent = paymentName;
  }
}
