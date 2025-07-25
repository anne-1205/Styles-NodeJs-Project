$(document).ready(function () {
    const url = 'http://172.34.98.64:4000/'
    function getCart() {
        let cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function renderCart() {
        let cart = getCart();
        let html = '';
        let total = 0;
        if (cart.length === 0) {
            html = '<p>Your cart is empty.</p>';
        } else {
            html = `<table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Description</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                        <th>Remove</th>
                    </tr>
                </thead>
                <tbody>`;
            cart.forEach((item, idx) => {
                let subtotal = item.price * item.quantity;
                total += subtotal;
                // Use item.description, fallback to item.name
                let desc = item.description || item.name || '';
                html += `<tr>
                    <td><img src="${item.image}" width="60"></td>
                    <td>${desc}</td>
                    <td>₱ ${item.price.toFixed(2)}</td>
                    <td>${item.quantity}</td>
                    <td>₱ ${(subtotal).toFixed(2)}</td>
                    <td><button class="btn btn-danger btn-sm remove-item" data-idx="${idx}">&times;</button></td>
                </tr>`;
            });
            html += `</tbody></table>
                <h4>Total: ₱ ${total.toFixed(2)}</h4>`;
        }

        $('#cartTable').html(html);
    }

    // function getUserId() {
    //     let userId = sessionStorage.getItem('userId');

    //     return userId ?? '';
    // }

    const getToken = () => {
        const token = sessionStorage.getItem('token');

        if (!token) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }
        return JSON.parse(token)
    }

    $('#cartTable').on('click', '.remove-item', function () {
        let idx = $(this).data('idx');
        let cart = getCart();
        cart.splice(idx, 1);
        saveCart(cart);
        renderCart();
    });

    $('#header').load("header.html");

    $('#checkoutBtn').on('click', function () {
        // Show order summary in modal
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        let summaryHtml = '<h5>Order Summary</h5><ul>';
        let total = 0;
        cart.forEach(item => {
            let subtotal = item.price * item.quantity;
            total += subtotal;
            let desc = item.description || item.name || '';
            summaryHtml += `<li>
                <img src="${item.image}" width="40" style="border-radius:6px;vertical-align:middle;margin-right:8px;">
                ${desc} x ${item.quantity} - ₱${subtotal.toFixed(2)}
            </li>`;
        });
        summaryHtml += `</ul><h5 class="mt-3">Total: ₱${total.toFixed(2)}</h5>`;
        $('#orderSummary').html(summaryHtml);

        $('#checkoutModal').modal('show');
    });

    // Handle order form submission
    $('#orderForm').on('submit', function (e) {
        e.preventDefault();
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        // Ensure each cart item has item_id, description, price, image, quantity
        cart = cart.map(item => ({
            item_id: item.id || item.item_id,
            description: item.description || item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity
        }));
        let orderData = {
            cart: cart,
            user: JSON.parse(sessionStorage.getItem('user')), // send user object
            shipping_address: $('#shipping_address').val(),
            shipping_city: $('#shipping_city').val(),
            shipping_state: $('#shipping_state').val(),
            shipping_zip: $('#shipping_zip').val(),
            shipping_phone: $('#shipping_phone').val(),
            notes: $('#notes').val()
        };

        // Get token from sessionStorage
        let token = sessionStorage.getItem('token');
        if (!token) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to place an order.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }

        $.ajax({
            method: 'POST',
            url: 'http://localhost:3000/api/v1/create-order',
            data: JSON.stringify(orderData),
            contentType: 'application/json',
            headers: { Authorization: 'Bearer ' + token }, // <-- This is critical!
            success: function (res) {
                Swal.fire('Order placed!', 'Thank you for your purchase.', 'success').then(() => {
                    localStorage.removeItem('cart');
                    $('#checkoutModal').modal('hide');
                    window.location.href = 'orders.html';
                });
            },
            error: function (err) {
                Swal.fire('Order failed', 'There was a problem placing your order.', 'error');
            }
        });
    });

    $('#checkoutModal').on('hidden.bs.modal', function () {
        $('#checkoutBtn').focus();
    });

    renderCart()

})