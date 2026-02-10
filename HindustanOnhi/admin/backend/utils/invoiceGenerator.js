const PDFDocument = require('pdfkit');

/**
 * Generate PDF invoice for an order
 * Returns a Buffer containing the PDF
 */
exports.generateInvoice = (order, userName) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      const orderId = order._id.toString().slice(-8).toUpperCase();
      const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      // ─── Header ───
      doc.fontSize(22).fillColor('#8B1A1A').text('HindustanOnhi', 50, 50);
      doc.fontSize(10).fillColor('#94a3b8').text('Indian Ethnic Fashion', 50, 76);

      // Invoice Title
      doc.fontSize(16).fillColor('#1e293b').text('INVOICE', 400, 50, { align: 'right' });
      doc.fontSize(10).fillColor('#64748b').text(`#INV-${orderId}`, 400, 72, { align: 'right' });
      doc.text(`Date: ${orderDate}`, 400, 86, { align: 'right' });

      // Divider
      doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#e2e8f0').stroke();

      // ─── Bill To ───
      doc.fontSize(10).fillColor('#94a3b8').text('BILL TO', 50, 130);
      doc.fontSize(11).fillColor('#1e293b').text(userName || order.shippingAddress.fullName, 50, 146);
      doc.fontSize(9).fillColor('#64748b');
      doc.text(order.shippingAddress.addressLine1, 50, 162);
      if (order.shippingAddress.addressLine2) {
        doc.text(order.shippingAddress.addressLine2);
      }
      doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
      doc.text(`Phone: ${order.shippingAddress.phone}`);

      // ─── Order Info ───
      doc.fontSize(10).fillColor('#94a3b8').text('ORDER DETAILS', 350, 130);
      doc.fontSize(9).fillColor('#64748b');
      doc.text(`Order ID: #${orderId}`, 350, 146);
      doc.text(`Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay (Paid)'}`, 350, 162);
      doc.text(`Status: ${order.isPaid ? 'PAID ✓' : 'Pending'}`, 350, 178);

      // ─── Items Table ───
      const tableTop = 230;
      const col = { item: 50, size: 280, qty: 350, price: 420, total: 480 };

      // Table header
      doc.rect(50, tableTop - 4, 495, 22).fill('#f8fafc');
      doc.fontSize(8).fillColor('#64748b');
      doc.text('ITEM', col.item + 4, tableTop, { width: 220 });
      doc.text('SIZE', col.size, tableTop, { width: 60, align: 'center' });
      doc.text('QTY', col.qty, tableTop, { width: 50, align: 'center' });
      doc.text('PRICE', col.price, tableTop, { width: 50, align: 'right' });
      doc.text('TOTAL', col.total, tableTop, { width: 60, align: 'right' });

      // Table rows
      let y = tableTop + 28;
      doc.fontSize(9).fillColor('#1e293b');

      order.orderItems.forEach((item) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        doc.fillColor('#1e293b').text(item.name, col.item + 4, y, { width: 220 });
        doc.fillColor('#64748b').text(item.size || '—', col.size, y, { width: 60, align: 'center' });
        doc.text(String(item.quantity), col.qty, y, { width: 50, align: 'center' });
        doc.text(`₹${item.price.toLocaleString('en-IN')}`, col.price, y, { width: 50, align: 'right' });
        doc.fillColor('#1e293b').text(`₹${(item.price * item.quantity).toLocaleString('en-IN')}`, col.total, y, { width: 60, align: 'right' });

        // Row divider
        y += 20;
        doc.moveTo(50, y).lineTo(545, y).strokeColor('#f1f5f9').stroke();
        y += 8;
      });

      // ─── Price Summary ───
      y += 10;
      const summaryX = 380;
      const summaryValX = 480;

      doc.fontSize(9).fillColor('#64748b');
      doc.text('Subtotal', summaryX, y);
      doc.fillColor('#1e293b').text(`₹${order.itemsPrice.toLocaleString('en-IN')}`, summaryValX, y, { width: 65, align: 'right' });

      y += 18;
      doc.fillColor('#64748b').text('Shipping', summaryX, y);
      doc.fillColor('#1e293b').text(order.shippingPrice === 0 ? 'FREE' : `₹${order.shippingPrice}`, summaryValX, y, { width: 65, align: 'right' });

      y += 18;
      doc.fillColor('#64748b').text('GST (5%)', summaryX, y);
      doc.fillColor('#1e293b').text(`₹${order.taxPrice.toLocaleString('en-IN')}`, summaryValX, y, { width: 65, align: 'right' });

      y += 6;
      doc.moveTo(summaryX, y + 10).lineTo(545, y + 10).strokeColor('#1e293b').lineWidth(1).stroke();

      y += 18;
      doc.fontSize(12).fillColor('#8B1A1A').font('Helvetica-Bold');
      doc.text('Total', summaryX, y);
      doc.text(`₹${order.totalPrice.toLocaleString('en-IN')}`, summaryValX, y, { width: 65, align: 'right' });

      // ─── Footer ───
      doc.font('Helvetica');
      const footerY = 760;
      doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.fontSize(8).fillColor('#94a3b8');
      doc.text('HindustanOnhi — Indian Ethnic Fashion | Made with ❤️ in India', 50, footerY + 10, { align: 'center', width: 495 });
      doc.text('This is a computer-generated invoice and does not require a signature.', 50, footerY + 24, { align: 'center', width: 495 });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
