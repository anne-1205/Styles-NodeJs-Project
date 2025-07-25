$(document).ready(function () {
    let token = sessionStorage.getItem('token');
    if (!token) window.location.href = 'login.html';

    function fetchOrders() {
        $.ajax({
            url: 'http://localhost:3000/api/v1/orders',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (data) {
                let html = `<table id="ordersTable"><thead><tr>
                    <th>Order ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                </tr></thead><tbody>`;
                data.orders.forEach(order => {
                    let itemsHtml = order.items.map(item =>
                        `<div style='margin-bottom:6px;'>
                            <img src='/images/${item.product_image}' width='32' style='border-radius:6px;margin-right:6px;vertical-align:middle;'>
                            <span><strong>${item.description}</strong> (x${item.quantity})<br>₱${item.sell_price}</span>
                        </div>`
                    ).join('');
                    let total = order.items.reduce((sum, item) => sum + item.sell_price * item.quantity, 0);
                    html += `<tr>
                        <td>${order.orderinfo_id}</td>
                        <td>${order.user_name}</td>
                        <td>${order.user_email}</td>
                        <td>${itemsHtml}</td>
                        <td>₱${total}</td>
                        <td>
                            <select class="order-status" data-id="${order.orderinfo_id}">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            </select>
                        </td>
                        <td>${order.date_placed ? order.date_placed.split('T')[0] : ''}</td>
                        <td><button class="admin-order-pdf-btn" data-orderid="${order.orderinfo_id}" style="background:#ff69b4;color:#fff;border:none;border-radius:20px;padding:6px 16px;font-weight:700;font-size:0.98em;cursor:pointer;">Download PDF</button></td>
                    </tr>`;
                });
                html += '</tbody></table>';
                $('#orders').html(html);
            },
            error: function () {
                $('#orders').html('<p>Error loading orders.</p>');
            }
        });
    }
    fetchOrders();

    $(document).on('change', '.order-status', function () {
        let id = $(this).data('id');
        let status = $(this).val();
        $.ajax({
            method: 'PUT',
            url: `http://localhost:3000/api/v1/orders/${id}/status`,
            headers: { Authorization: "Bearer " + token },
            contentType: "application/json",
            data: JSON.stringify({ status }),
            success: fetchOrders
        });
    });

    // PDF Download logic
    $('.admin-order-pdf-btn').on('click', function() {
        const orderId = $(this).data('orderid');
        let token = sessionStorage.getItem('token');
        fetch(`http://localhost:3000/api/v1/order/${orderId}/receipt`, {
            headers: { Authorization: 'Bearer ' + token }
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to download PDF');
            return response.blob();
        })
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Order_${orderId}_Receipt.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        })
        .catch(() => {
            alert('Failed to download PDF. Please make sure you are logged in.');
        });
    });

    $('#logoutBtn').on('click', function() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
});


