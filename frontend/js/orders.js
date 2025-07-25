$(document).ready(function () {
    let token = sessionStorage.getItem('token');
    if (!token) {
        alert('You must be logged in to view orders.');
        window.location.href = 'login.html';
        return;
    }
    $.ajax({
        method: "GET",
        url: "http://localhost:3000/api/v1/my-orders",
        headers: { Authorization: "Bearer " + token },
        success: function (data) {
            if (!data.orders || data.orders.length === 0) {
                $('#orders').html('<p>No orders found.</p>');
                return;
            }
            let html = '';
            data.orders.forEach((order, idx) => {
                let status = order.status || 'pending';
                html += `<div class="order-card">
                    <div class="order-header">
                        <div>
                            <strong>Order #${order.orderinfo_id}</strong> <span style="font-size:0.95em; color:#d72660;">| Placed: ${order.date_placed}</span>
                        </div>
                        <span class="order-status">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </div>
                    <div style="margin-bottom:8px;">
                        <strong>Shipping:</strong> ${order.shipping_address || ''}, ${order.shipping_city || ''}, ${order.shipping_state || ''} ${order.shipping_zip || ''} <span style="margin-left:12px;"><strong>Phone:</strong> ${order.shipping_phone || ''}</span>
                    </div>
                    <ul class="order-items-list">
                        ${order.items.map(item => `
                            <li style='display:flex;align-items:center;'>
                                <img src='/images/${item.product_image}' width='38' style='border-radius:8px;margin-right:10px;'>
                                <span><strong>${item.description}</strong> (ID: ${item.item_id})<br>Qty: ${item.quantity} | Price: ₱${item.sell_price}</span>
                            </li>`).join('')}
                    </ul>
                    <button class="order-details-btn" data-idx="${idx}">Order Details</button>
                    <button class="order-pdf-btn" data-orderid="${order.orderinfo_id}" style="margin-left:12px;background:#ff69b4;color:#fff;border:none;border-radius:20px;padding:8px 22px;font-weight:700;font-size:1em;cursor:pointer;">Download PDF</button>
                </div>`;
            });
            $('#orders').html(html);

            // Order Details Modal logic
            $('.order-details-btn').on('click', function() {
                const idx = $(this).data('idx');
                const order = data.orders[idx];
                let detailsHtml = `<div><strong>Order #${order.orderinfo_id}</strong><br>Placed: ${order.date_placed}<br>Status: ${order.status || 'pending'}</div><hr>`;
                detailsHtml += `<div><strong>Shipping Address:</strong> ${order.shipping_address || ''}, ${order.shipping_city || ''}, ${order.shipping_state || ''} ${order.shipping_zip || ''}<br><strong>Phone:</strong> ${order.shipping_phone || ''}</div><hr>`;
                detailsHtml += '<ul>';
                order.items.forEach(item => {
                    detailsHtml += `<li style='display:flex;align-items:center;margin-bottom:8px;'>
                        <img src='/images/${item.product_image}' width='48' style='border-radius:8px;margin-right:12px;'>
                        <span><strong>${item.description}</strong> (ID: ${item.item_id})<br>Qty: ${item.quantity} | Price: ₱${item.sell_price}</span>
                    </li>`;
                });
                detailsHtml += '</ul>';
                $('#orderDetailsBody').html(detailsHtml);
                $('#orderDetailsModal').modal('show');
            });

            // PDF Download logic
            $('.order-pdf-btn').on('click', function() {
                const orderId = $(this).data('orderid');
                window.open(`http://localhost:3000/api/v1/order/${orderId}/receipt`, '_blank');
            });
        },
        error: function (err) {
            $('#orders').html('<p>Error loading orders.</p>');
        }
    });

    $('#logoutBtn').on('click', function () {
        sessionStorage.removeItem('token');
        window.location.href = 'login.html';
    });
});


