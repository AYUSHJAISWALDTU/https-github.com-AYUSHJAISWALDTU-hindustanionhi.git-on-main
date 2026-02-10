const nodemailer = require('nodemailer');

/**
 * Create reusable transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send order confirmation email
 */
exports.sendOrderConfirmationEmail = async (email, order, userName) => {
  try {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') {
      console.log('📧 Email not configured — skipping order confirmation email');
      return;
    }

    const transporter = createTransporter();

    const itemRows = order.orderItems
      .map(
        (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">${item.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${item.size || '—'}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">₹${item.price.toLocaleString('en-IN')}</td>
        </tr>`
      )
      .join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #8B1A1A 0%, #c0392b 100%); padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🪷 HindustanOnhi</h1>
          <p style="color: #fde8e8; margin: 8px 0 0; font-size: 14px;">Indian Ethnic Fashion</p>
        </div>

        <!-- Content -->
        <div style="padding: 30px;">
          <h2 style="color: #1e293b; margin: 0 0 8px;">Order Confirmed! 🎉</h2>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6;">
            Hi ${userName || 'there'},<br>
            Thank you for your order! We've received your payment and your order is being processed.
          </p>

          <!-- Order Info -->
          <div style="background: #f8fafc; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
            <table width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="color:#64748b;font-size:13px;">Order ID</td>
                <td style="text-align:right;font-weight:700;color:#1e293b;font-size:13px;">#${order._id.toString().slice(-8).toUpperCase()}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding-top:8px;">Date</td>
                <td style="text-align:right;color:#1e293b;font-size:13px;padding-top:8px;">${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
              </tr>
              <tr>
                <td style="color:#64748b;font-size:13px;padding-top:8px;">Payment</td>
                <td style="text-align:right;font-size:13px;padding-top:8px;">
                  <span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">
                    ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'PAID ✓'}
                  </span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Items Table -->
          <table width="100%" style="border-collapse:collapse;margin:20px 0;">
            <thead>
              <tr style="background:#f8fafc;">
                <th style="padding:10px 12px;text-align:left;color:#64748b;font-size:12px;text-transform:uppercase;">Item</th>
                <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;">Size</th>
                <th style="padding:10px 12px;text-align:center;color:#64748b;font-size:12px;text-transform:uppercase;">Qty</th>
                <th style="padding:10px 12px;text-align:right;color:#64748b;font-size:12px;text-transform:uppercase;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <!-- Price Summary -->
          <div style="border-top:2px solid #f1f5f9;padding-top:16px;">
            <table width="100%" style="border-collapse:collapse;">
              <tr>
                <td style="padding:4px 0;color:#64748b;font-size:14px;">Subtotal</td>
                <td style="text-align:right;color:#1e293b;font-size:14px;">₹${order.itemsPrice.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#64748b;font-size:14px;">Shipping</td>
                <td style="text-align:right;color:#1e293b;font-size:14px;">${order.shippingPrice === 0 ? '<span style="color:#10b981;">FREE</span>' : '₹' + order.shippingPrice}</td>
              </tr>
              <tr>
                <td style="padding:4px 0;color:#64748b;font-size:14px;">GST (5%)</td>
                <td style="text-align:right;color:#1e293b;font-size:14px;">₹${order.taxPrice.toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td style="padding:10px 0 0;font-weight:700;color:#1e293b;font-size:16px;border-top:1px solid #e2e8f0;">Total</td>
                <td style="text-align:right;padding:10px 0 0;font-weight:700;color:#8B1A1A;font-size:16px;border-top:1px solid #e2e8f0;">₹${order.totalPrice.toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>

          <!-- Shipping Address -->
          <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin:24px 0;">
            <h3 style="margin:0 0 8px;font-size:14px;color:#1e293b;">📦 Shipping To</h3>
            <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
              ${order.shippingAddress.fullName}<br>
              ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
              Phone: ${order.shippingAddress.phone}
            </p>
          </div>

          <p style="color:#64748b;font-size:13px;line-height:1.6;margin-top:24px;">
            We'll notify you when your order ships. If you have any questions, feel free to reply to this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background:#f8fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">
            🪷 HindustanOnhi — Indian Ethnic Fashion<br>
            Made with ❤️ in India
          </p>
        </div>
      </div>
    </body>
    </html>`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `HindustanOnhi <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Confirmed — HindustanOnhi #${order._id.toString().slice(-8).toUpperCase()} 🎉`,
      html,
    });

    console.log(`📧 Order confirmation email sent to ${email}`);
  } catch (error) {
    console.error('📧 Email sending failed:', error.message);
    // Don't throw — email failure shouldn't break the order flow
  }
};

/**
 * Send order shipped email with Blue Dart tracking
 */
exports.sendOrderShippedEmail = async (email, order, userName) => {
  try {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') return;

    const transporter = createTransporter();

    const courierName = order.shipping?.courier || 'Blue Dart';
    const awb = order.shipping?.awbNumber || order.trackingNumber || '';
    const trackingUrl = order.shipping?.trackingUrl ||
      (awb ? `https://www.bluedart.com/trackdartresultthirdparty?trackFor=0&trackNo=${awb}` : '');

    const html = `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;background:#fff;">
      <div style="background:linear-gradient(135deg,#8B1A1A,#c0392b);padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;">🪷 HindustanOnhi</h1>
        <p style="color:#fde8e8;margin:8px 0 0;font-size:14px;">Indian Ethnic Fashion</p>
      </div>
      <div style="padding:30px;">
        <h2 style="color:#1e293b;margin:0 0 8px;">Your order has been shipped! 🚚</h2>
        <p style="color:#64748b;font-size:15px;line-height:1.6;">Hi ${userName},</p>
        <p style="color:#64748b;font-size:15px;line-height:1.6;">
          Great news! Your order <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> is on its way.
        </p>

        <!-- Shipping Details Card -->
        <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:20px;margin:20px 0;">
          <h3 style="margin:0 0 12px;color:#0369a1;font-size:16px;">📦 Shipping Details</h3>
          <table width="100%" style="border-collapse:collapse;">
            <tr>
              <td style="color:#64748b;font-size:14px;padding:6px 0;">Courier Partner</td>
              <td style="text-align:right;font-weight:700;color:#1e293b;font-size:14px;">${courierName}</td>
            </tr>
            ${awb ? `
            <tr>
              <td style="color:#64748b;font-size:14px;padding:6px 0;">AWB / Tracking No.</td>
              <td style="text-align:right;font-weight:700;color:#1e293b;font-size:14px;font-family:monospace;">${awb}</td>
            </tr>` : ''}
            <tr>
              <td style="color:#64748b;font-size:14px;padding:6px 0;">Shipped On</td>
              <td style="text-align:right;color:#1e293b;font-size:14px;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="color:#64748b;font-size:14px;padding:6px 0;">Expected Delivery</td>
              <td style="text-align:right;color:#1e293b;font-size:14px;">5–7 business days</td>
            </tr>
          </table>
        </div>

        ${trackingUrl ? `
        <!-- Track Button -->
        <div style="text-align:center;margin:24px 0;">
          <a href="${trackingUrl}" target="_blank"
             style="display:inline-block;background:#0369a1;color:#fff;padding:14px 32px;border-radius:8px;
                    text-decoration:none;font-weight:700;font-size:15px;">
            🔍 Track on ${courierName}
          </a>
          <p style="color:#94a3b8;font-size:12px;margin:10px 0 0;">
            Or visit: <a href="${trackingUrl}" style="color:#0369a1;">${trackingUrl}</a>
          </p>
        </div>` : ''}

        <!-- Shipping Address -->
        ${order.shippingAddress ? `
        <div style="background:#f8fafc;border-radius:10px;padding:16px 20px;margin:20px 0;">
          <h3 style="margin:0 0 8px;font-size:14px;color:#1e293b;">📍 Delivering To</h3>
          <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
            ${order.shippingAddress.fullName}<br>
            ${order.shippingAddress.addressLine1}${order.shippingAddress.addressLine2 ? ', ' + order.shippingAddress.addressLine2 : ''}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}<br>
            Phone: ${order.shippingAddress.phone}
          </p>
        </div>` : ''}

        <p style="color:#64748b;font-size:13px;line-height:1.6;margin-top:24px;">
          If you have any questions about your shipment, feel free to reply to this email.
        </p>
      </div>
      <div style="background:#f8fafc;padding:20px 30px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">
          🪷 HindustanOnhi — Indian Ethnic Fashion<br>
          Made with ❤️ in India
        </p>
      </div>
    </div>`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `HindustanOnhi <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your order has shipped via ${courierName}! — #${order._id.toString().slice(-8).toUpperCase()} 🚚`,
      html,
    });

    console.log(`📧 Order shipped email sent to ${email}`);
  } catch (error) {
    console.error('📧 Shipped email failed:', error.message);
  }
};

/**
 * Send order cancellation email
 */
exports.sendCancellationEmail = async (email, order, userName) => {
  try {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') return;

    const transporter = createTransporter();
    const orderId = order._id.toString().slice(-8).toUpperCase();
    const hasRefund = order.refund?.status === 'completed' || order.refund?.status === 'initiated';

    const html = `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;background:#fff;">
      <div style="background:linear-gradient(135deg,#8B1A1A,#c0392b);padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;">🪷 HindustanOnhi</h1>
      </div>
      <div style="padding:30px;">
        <h2 style="color:#1e293b;">Order Cancelled</h2>
        <p style="color:#64748b;">Hi ${userName},</p>
        <p style="color:#64748b;">Your order <strong>#${orderId}</strong> has been cancelled.</p>
        <p style="color:#64748b;">Reason: ${order.cancellation?.reason || 'Not specified'}</p>
        ${hasRefund ? `
        <div style="background:#d1fae5;border-radius:10px;padding:16px 20px;margin:20px 0;">
          <h3 style="margin:0 0 8px;color:#065f46;">💰 Refund ${order.refund.status === 'completed' ? 'Processed' : 'Initiated'}</h3>
          <p style="margin:0;color:#065f46;">Amount: <strong>₹${order.totalPrice.toLocaleString('en-IN')}</strong></p>
          ${order.refund.razorpayRefundId ? `<p style="margin:4px 0 0;color:#065f46;font-size:13px;">Refund ID: ${order.refund.razorpayRefundId}</p>` : ''}
          <p style="margin:4px 0 0;color:#065f46;font-size:13px;">Amount will reflect in your account within 5–7 business days.</p>
        </div>` : ''}
      </div>
      <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">🪷 HindustanOnhi — Indian Ethnic Fashion</p>
      </div>
    </div>`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `HindustanOnhi <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Order Cancelled — #${orderId}`,
      html,
    });
    console.log(`📧 Cancellation email sent to ${email}`);
  } catch (error) {
    console.error('📧 Cancellation email failed:', error.message);
  }
};

/**
 * Send refund processed email
 */
exports.sendRefundEmail = async (email, order, userName) => {
  try {
    if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_email@gmail.com') return;

    const transporter = createTransporter();
    const orderId = order._id.toString().slice(-8).toUpperCase();

    const html = `
    <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',sans-serif;background:#fff;">
      <div style="background:linear-gradient(135deg,#8B1A1A,#c0392b);padding:30px;text-align:center;">
        <h1 style="color:#fff;margin:0;">🪷 HindustanOnhi</h1>
      </div>
      <div style="padding:30px;">
        <h2 style="color:#1e293b;">Refund Processed ✅</h2>
        <p style="color:#64748b;">Hi ${userName},</p>
        <p style="color:#64748b;">Your refund for order <strong>#${orderId}</strong> has been successfully processed.</p>
        <div style="background:#d1fae5;border-radius:10px;padding:16px 20px;margin:20px 0;">
          <p style="margin:0;color:#065f46;">Refund Amount: <strong>₹${(order.refund?.amount || order.totalPrice).toLocaleString('en-IN')}</strong></p>
          ${order.refund?.razorpayRefundId ? `<p style="margin:8px 0 0;color:#065f46;font-size:13px;">Refund ID: ${order.refund.razorpayRefundId}</p>` : ''}
          <p style="margin:8px 0 0;color:#065f46;font-size:13px;">Amount will reflect in your account within 5–7 business days.</p>
        </div>
      </div>
      <div style="background:#f8fafc;padding:16px;text-align:center;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">🪷 HindustanOnhi — Indian Ethnic Fashion</p>
      </div>
    </div>`;

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `HindustanOnhi <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Refund Processed — ₹${(order.refund?.amount || order.totalPrice).toLocaleString('en-IN')} — #${orderId} ✅`,
      html,
    });
    console.log(`📧 Refund email sent to ${email}`);
  } catch (error) {
    console.error('📧 Refund email failed:', error.message);
  }
};
