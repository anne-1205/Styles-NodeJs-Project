const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generateOrderPDF(order, stream) {
    const doc = new PDFDocument({ margin: 36 });
    doc.pipe(stream);

    // Set full light pink background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffe4ec');

    // Pink Header
    doc.fillColor('#ff69b4').rect(0, 0, doc.page.width, 70).fill('#ff69b4');
    doc.fillColor('#fff').fontSize(26).font('Helvetica-Bold').text('STYLES E-Commerce', 40, 22, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text('support@styles.com | +63 900 000 0000', -40, 48, { align: 'right' });

    // Title
    doc.moveDown(2);
    doc.fillColor('#ff69b4').fontSize(22).font('Helvetica-Bold').text('Order Receipt', { align: 'center', underline: true });
    doc.moveDown(1);

    // Order Info Box
    const boxStartY = doc.y;
    doc.roundedRect(36, boxStartY, doc.page.width - 72, 120, 10)
        .fillOpacity(1)
        .fillAndStroke('#fff', '#ff69b4');

    const textX = 48;
    let textY = boxStartY + 10;
    doc.fillOpacity(1);
    doc.fillColor('#18141c').fontSize(12).font('Helvetica-Bold')
        .text(`Order ID: ${order.orderinfo_id}`, textX, textY);
    doc.font('Helvetica')
        .text(`Placed: ${new Date(order.date_placed).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}`);
    doc.font('Helvetica-Bold')
        .text(`Status: `, { continued: true })
        .fillColor(order.status === 'delivered' ? '#28a745' : '#d72660')
        .text(order.status.charAt(0).toUpperCase() + order.status.slice(1));
    doc.fillColor('#18141c').font('Helvetica').text(`Customer: ${order.user_name}`);
    doc.text(`Email: ${order.user_email}`);
    doc.text(`Shipping: ${order.shipping_address || ''}, ${order.shipping_city || ''}, ${order.shipping_state || ''} ${order.shipping_zip || ''}`);
    doc.text(`Phone: ${order.shipping_phone || ''}`);
    doc.moveDown(2);

    // Items Title
    doc.fillColor('#ff69b4').fontSize(16).font('Helvetica-Bold').text('Items:', { underline: true });
    doc.moveDown(0.5);

    // Items List
    let itemY = doc.y;
    order.items.forEach((item, idx) => {
        const boxY = itemY;
        // White background for item box
        doc.roundedRect(48, boxY, doc.page.width - 96, 70, 8)
            .fillOpacity(1)
            .fillAndStroke('#fff', '#ff69b4');
        doc.fillOpacity(1);

        // Image if exists
        if (item.product_image) {
            const imagePath = path.join(__dirname, '../images', item.product_image);
            if (fs.existsSync(imagePath)) {
                try {
                    doc.image(imagePath, 56, boxY + 13, { width: 44, height: 44, fit: [44, 44] });
                } catch (e) {
                    doc.fillColor('#d72660').fontSize(10).text('[Image error]', 56, boxY + 30);
                }
            } else {
                doc.fillColor('#d72660').fontSize(10).text('[No image]', 56, boxY + 30);
            }
        }

        // Text beside image
        doc.fillColor('#18141c').fontSize(13).font('Helvetica-Bold')
            .text(item.description, 108, boxY + 15);
        doc.font('Helvetica').fontSize(12)
            .text(`Qty: ${item.quantity}  |  Price: ₱${item.sell_price}`, 108, boxY + 35);

        itemY += 80;
        doc.y = itemY;
    });

    doc.moveDown(1.5);

    // Total Section
    doc.fillColor('#ff69b4').fontSize(16).font('Helvetica-Bold')
        .text(`Total: ₱${order.total}`, { align: 'right' });

    doc.moveDown(2);

    // Footer
    doc.fillColor('#18141c').fontSize(12).font('Helvetica-Oblique')
        .text('Thank you for shopping with STYLES!', { align: 'center' });

    doc.end();
}

module.exports = generateOrderPDF;
