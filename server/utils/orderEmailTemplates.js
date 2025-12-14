// server/utils/orderEmailTemplates.js

function renderItemsTable(order) {
  const itemsHtml = (order.orderItems || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:4px 8px;">${item.title}</td>
        <td style="padding:4px 8px; text-align:center;">${item.qty}</td>
        <td style="padding:4px 8px; text-align:right;">₹${item.price}</td>
      </tr>`
    )
    .join("");

  return `
    <table style="border-collapse:collapse; width:100%; margin-top:12px;">
      <thead>
        <tr>
          <th style="text-align:left; padding:4px 8px;">Item</th>
          <th style="text-align:center; padding:4px 8px;">Qty</th>
          <th style="text-align:right; padding:4px 8px;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
  `;
}

function orderConfirmationTemplate({ name, order, appName = "Scentiva" }) {
  const itemsTable = renderItemsTable(order);

  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.6;">
      <h2 style="color:#8B5E3C;">Thank you for your order 🕯️</h2>
      <p>Hi ${name || "there"},</p>
      <p>We've received your order <strong>#${order._id}</strong>.</p>
      ${itemsTable}
      <p style="margin-top:12px;">
        <strong>Total:</strong> ₹${order.totalPrice}
      </p>
      <p style="margin-top:16px;">We’ll notify you when your order is shipped.</p>
      <p>Love & Light,<br/>${appName} Team</p>
    </div>
  `;
}

function orderStatusUpdateTemplate({ name, order, appName = "Scentiva" }) {
  const extra =
    order.status === "shipped"
      ? "<p>Your order is on its way 🚚</p>"
      : order.status === "delivered"
      ? "<p>We hope you enjoy your scents 🕯️</p>"
      : "";

  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.6;">
      <p>Hi ${name || "there"},</p>
      <p>Your order <strong>#${order._id}</strong> status has been updated.</p>
      <p><strong>New status:</strong> ${order.status}</p>
      ${extra}
      <p style="margin-top:16px;">Love & Light,<br/>${appName} Team</p>
    </div>
  `;
}

function adminNewOrderTemplate({ order, user, appName = "Scentiva" }) {
  const itemsTable = renderItemsTable(order);

  return `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height:1.6;">
      <h2 style="color:#8B5E3C;">New order received</h2>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>User:</strong> ${user?.name || "Guest"} (${user?.email || "no email"})</p>
      <p><strong>Total:</strong> ₹${order.totalPrice}</p>
      ${itemsTable}
      <p style="margin-top:16px;">– ${appName} System</p>
    </div>
  `;
}

module.exports = {
  orderConfirmationTemplate,
  orderStatusUpdateTemplate,
  adminNewOrderTemplate,
};
