$(document).ready(function () {
    let token = sessionStorage.getItem('token');
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Login Required',
            text: 'You must be logged in to view orders.'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }

    fetchOrders();

    function fetchOrders() {
        $.ajax({
            method: "GET",
            url: "http://localhost:3000/api/v1/my-orders",
            headers: { Authorization: "Bearer " + token },
            success: function (data) {
                if (!data.orders || data.orders.length === 0) {
                    $('#orders').html('<p>No orders found.</p>');
                    return;
                }

                // Fetch user reviews to check which items have been reviewed
                fetchUserReviews().then(userReviews => {
                    renderOrders(data.orders, userReviews);
                }).catch(error => {
                    console.error('Error fetching user reviews:', error);
                    renderOrders(data.orders, []);
                });
            },
            error: function (err) {
                $('#orders').html('<p>Error loading orders.</p>');
            }
        });
    }

    async function fetchUserReviews() {
        try {
            const response = await fetch('http://localhost:3000/api/v1/user/reviews', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await response.json();
            return data.success ? data.reviews : [];
        } catch (error) {
            console.error('Error fetching user reviews:', error);
            return [];
        }
    }

    function renderOrders(orders, userReviews) {
        let html = '';
        orders.forEach((order, idx) => {
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
                    ${order.items.map(item => {
                        const canReview = order.status === 'delivered';
                        const existingReview = userReviews.find(review => 
                            review.item_id == item.item_id && review.orderinfo_id == order.orderinfo_id
                        );
                        
                        let reviewButton = '';
                        if (canReview) {
                            if (existingReview) {
                                reviewButton = `
                                    <div style="display:flex;gap:8px;margin-top:5px;">
                                        <button class="review-btn" onclick="reviewSystem.showReviewModal(${item.item_id}, ${order.orderinfo_id}, '${item.description}')" style="background:#28a745;">
                                            <i class="fas fa-edit"></i> Edit Review
                                        </button>
                                        <button class="review-btn" onclick="reviewSystem.deleteReview(${existingReview.id})" style="background:#dc3545;">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                `;
                            } else {
                                reviewButton = `
                                    <button class="review-btn" onclick="reviewSystem.showReviewModal(${item.item_id}, ${order.orderinfo_id}, '${item.description}')">
                                        <i class="fas fa-star"></i> Leave Review
                                    </button>
                                `;
                            }
                        }
                        
                        return `<li style='display:flex;align-items:center;'>
                            <img src='/images/${item.product_image}' width='38' style='border-radius:8px;margin-right:10px;'>
                            <span><strong>${item.description}</strong> (ID: ${item.item_id})<br>Qty: ${item.quantity} | Price: ₱${item.sell_price}</span>
                            ${reviewButton}
                        </li>`;
                    }).join('')}
                </ul>
                <button class="order-details-btn" data-idx="${idx}">Order Details</button>
                <button class="order-pdf-btn" data-orderid="${order.orderinfo_id}" style="margin-left:12px;background:#ff69b4;color:#fff;border:none;border-radius:20px;padding:8px 22px;font-weight:700;font-size:1em;cursor:pointer;transition:all 0.3s ease;">
                    <i class="fas fa-download"></i> Download PDF
                </button>
            </div>`;
        });
        $('#orders').html(html);

        // Order Details Modal logic
        $('.order-details-btn').on('click', function() {
            const idx = $(this).data('idx');
            const order = orders[idx];
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

        // Enhanced PDF Download logic
        $('.order-pdf-btn').on('click', function() {
            const orderId = $(this).data('orderid');
            const button = $(this);
            
            // Show loading state
            button.prop('disabled', true);
            button.html('<i class="fas fa-spinner fa-spin"></i> Generating...');
            
            // Fetch PDF with proper authentication
            fetch(`http://localhost:3000/api/v1/order/${orderId}/receipt`, {
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
                
                // Show error message
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
                button.html('<i class="fas fa-download"></i> Download PDF');
            });
        });
    }

    $('#logoutBtn').on('click', function () {
        sessionStorage.removeItem('token');
        window.location.href = 'login.html';
    });
});


