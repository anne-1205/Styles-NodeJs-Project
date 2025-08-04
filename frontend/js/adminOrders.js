$(document).ready(function () {
    let token = sessionStorage.getItem('token');
    if (!token) window.location.href = 'login.html';

    function fetchOrders() {
        $.ajax({
            url: 'http://localhost:3000/api/v1/orders',
            method: 'GET',
            headers: { Authorization: 'Bearer ' + token },
            success: function (data) {
                if (!data.orders || data.orders.length === 0) {
                    $('#orders').html('<div style="text-align:center;padding:40px;color:#ff69b4;"><i class="fas fa-inbox"></i> No orders found.</div>');
                    return;
                }

                let html = `<table id="ordersTable"><thead><tr>
                    <th>Order ID</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr></thead><tbody>`;
                
                data.orders.forEach(order => {
                    let itemsHtml = order.items.map(item =>
                        `<div style='margin-bottom:6px;display:flex;align-items:center;justify-content:center;'>
                            <img src='/images/${item.product_image}' width='32' height='32' style='border-radius:6px;margin-right:8px;object-fit:cover;'>
                            <div style='text-align:left;'>
                                <strong>${item.description}</strong> (x${item.quantity})<br>
                                <span style='color:#666;font-size:0.9em;'>₱${item.sell_price}</span>
                            </div>
                        </div>`
                    ).join('');
                    
                    let total = order.items.reduce((sum, item) => sum + (item.sell_price * item.quantity), 0);
                    // Ensure status is one of the allowed values
                    let validStatus = order.status;
                    if (!['pending', 'shipped', 'delivered'].includes(validStatus)) {
                        validStatus = 'pending';
                    }
                    let statusClass = `status-${validStatus}`;
                    
                    html += `<tr>
                        <td><strong>#${order.orderinfo_id}</strong></td>
                        <td>${order.user_name}</td>
                        <td>${order.user_email}</td>
                        <td style='max-width:200px;'>${itemsHtml}</td>
                        <td><strong>₱${total.toFixed(2)}</strong></td>
                        <td>
                            <div style="display:flex;flex-direction:column;gap:8px;align-items:center;">
                                <span class="status-badge ${statusClass}">${validStatus}</span>
                                <select class="order-status" data-id="${order.orderinfo_id}">
                                    <option value="pending" ${validStatus === 'pending' ? 'selected' : ''}>Pending</option>
                                    <option value="shipped" ${validStatus === 'shipped' ? 'selected' : ''}>Shipped</option>
                                    <option value="delivered" ${validStatus === 'delivered' ? 'selected' : ''}>Delivered</option>
                                </select>
                            </div>
                        </td>
                        <td>${order.date_placed ? new Date(order.date_placed).toLocaleDateString() : ''}</td>
                        <td>
                            <button class="admin-order-pdf-btn" data-orderid="${order.orderinfo_id}" title="Download PDF Receipt">
                                <i class="fas fa-download"></i> PDF
                            </button>
                        </td>
                    </tr>`;
                });
                html += '</tbody></table>';
                $('#orders').html(html);
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Session Expired',
                        text: 'Please login again to continue.',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        sessionStorage.clear();
                        window.location.href = 'login.html';
                    });
                } else {
                    $('#orders').html('<div style="text-align:center;padding:40px;color:#ff6b6b;"><i class="fas fa-exclamation-triangle"></i> Error loading orders. Please try again.</div>');
                }
            }
        });
    }

    // Initial fetch
    fetchOrders();

    // Status change handler
    $(document).on('change', '.order-status', function () {
        let id = $(this).data('id');
        let status = $(this).val();
        let originalStatus = $(this).find('option:selected').text();
        
        // Show loading state
        $(this).prop('disabled', true);
        
        $.ajax({
            method: 'PUT',
            url: `http://localhost:3000/api/v1/orders/${id}/status`,
            headers: { Authorization: "Bearer " + token },
            contentType: "application/json",
            data: JSON.stringify({ status }),
            success: function(response) {
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: `Order #${id} status changed to ${originalStatus}`,
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchOrders(); // Refresh the table
            },
            error: function(xhr) {
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: xhr.responseJSON?.message || 'Failed to update order status',
                    confirmButtonText: 'OK'
                });
                fetchOrders(); // Refresh to show original status
            }
        });
    });

    // Enhanced PDF Download functionality
    $(document).on('click', '.admin-order-pdf-btn', function() {
        const orderId = $(this).data('orderid');
        const button = $(this);
        
        // Show loading state
        button.prop('disabled', true);
        button.html('<i class="fas fa-spinner fa-spin"></i> Generating...');
        
        // Fetch PDF from server using admin route
        fetch(`http://localhost:3000/api/v1/admin/order/${orderId}/receipt`, {
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Accept': 'application/pdf'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.blob();
        })
        .then(blob => {
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Order_${orderId}_Receipt.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'PDF Downloaded',
                text: `Receipt for Order #${orderId} has been downloaded successfully!`,
                timer: 2000,
                showConfirmButton: false
            });
        })
        .catch(error => {
            console.error('PDF download error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Download Failed',
                text: 'Failed to download PDF. Please try again or contact support.',
                confirmButtonText: 'OK'
            });
        })
        .finally(() => {
            // Reset button state
            button.prop('disabled', false);
            button.html('<i class="fas fa-download"></i> PDF');
        });
    });

    // Logout handler
    $('#logoutBtn').on('click', function() {
        Swal.fire({
            title: 'Logout',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ff69b4',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, Logout',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    });
});


