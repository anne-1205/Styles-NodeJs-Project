$(document).ready(function () {
    const url = 'http://172.34.98.64:4000/'
    
    // Debug function to track cart operations
    function debugCart(operation, data) {
        console.log(`Cart ${operation}:`, data);
        console.log('Current cart:', JSON.parse(localStorage.getItem('cart') || '[]'));
    }
    
    function getCart() {
        let cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
        debugCart('saved', cart);
    }

    function renderCart() {
        let cart = getCart();
        debugCart('rendering', cart);
        
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
                    <td>
                        <div class="quantity-controls" style="display:flex;align-items:center;gap:8px;">
                            <button class="btn btn-sm btn-outline-secondary quantity-down" data-idx="${idx}" style="width:30px;height:30px;padding:0;border-radius:50%;font-size:12px;color:#ff69b4;border-color:#ff69b4;">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <span class="quantity-display" style="min-width:30px;text-align:center;font-weight:bold;color:#fff;">${item.quantity}</span>
                            <button class="btn btn-sm btn-outline-secondary quantity-up" data-idx="${idx}" style="width:30px;height:30px;padding:0;border-radius:50%;font-size:12px;color:#ff69b4;border-color:#ff69b4;">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                        </div>
                    </td>
                    <td>₱ ${(subtotal).toFixed(2)}</td>
                    <td><button class="btn btn-danger btn-sm remove-item" data-idx="${idx}">&times;</button></td>
                </tr>`;
            });
            html += `</tbody></table>
                <h4>Total: ₱ ${total.toFixed(2)}</h4>`;
        }

        $('#cartTable').html(html);
    }

    // Clear cart function for testing
    function clearCart() {
        localStorage.removeItem('cart');
        debugCart('cleared', []);
        renderCart();
    }
    
    // Make clearCart globally accessible for debugging
    window.clearCart = clearCart;
    
    // Function to inspect cart state
    function inspectCart() {
        const cart = getCart();
        console.log('=== CART INSPECTION ===');
        console.log('Cart items:', cart);
        console.log('Cart length:', cart.length);
        cart.forEach((item, index) => {
            console.log(`Item ${index}:`, {
                id: item.id,
                name: item.name,
                description: item.description,
                price: item.price,
                quantity: item.quantity,
                image: item.image
            });
        });
        console.log('=== END INSPECTION ===');
    }
    
    // Make inspectCart globally accessible for debugging
    window.inspectCart = inspectCart;
    
    // Test function to add a product with quantity 1
    function testAddToCart() {
        const testProduct = {
            id: 'test-product',
            name: 'Test Product',
            description: 'Test Product Description',
            price: 100,
            image: '/images/test.jpg',
            quantity: 1
        };
        
        let cart = getCart();
        let existing = cart.find(item => item.id === testProduct.id);
        
        if (existing) {
            existing.quantity += 1;
            console.log('Updated existing item quantity to:', existing.quantity);
        } else {
            cart.push(testProduct);
            console.log('Added new item with quantity:', testProduct.quantity);
        }
        
        saveCart(cart);
        renderCart();
    }
    
    // Make testAddToCart globally accessible for debugging
    window.testAddToCart = testAddToCart;

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

    // Remove item from cart
    $('#cartTable').on('click', '.remove-item', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        let idx = $(this).data('idx');
        let cart = getCart();
        debugCart('removing item', { idx, item: cart[idx] });
        cart.splice(idx, 1);
        saveCart(cart);
        renderCart();
    });

    // Quantity up button
    $('#cartTable').on('click', '.quantity-up', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        let idx = $(this).data('idx');
        let cart = getCart();
        if (cart[idx]) {
            cart[idx].quantity += 1;
            debugCart('increased quantity', { idx, item: cart[idx] });
            saveCart(cart);
            renderCart();
        }
    });

    // Quantity down button
    $('#cartTable').on('click', '.quantity-down', function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        let idx = $(this).data('idx');
        let cart = getCart();
        if (cart[idx] && cart[idx].quantity > 1) {
            cart[idx].quantity -= 1;
            debugCart('decreased quantity', { idx, item: cart[idx] });
            saveCart(cart);
            renderCart();
        } else if (cart[idx] && cart[idx].quantity === 1) {
            // Remove item if quantity would become 0
            debugCart('removing item (quantity 0)', { idx, item: cart[idx] });
            cart.splice(idx, 1);
            saveCart(cart);
            renderCart();
        }
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