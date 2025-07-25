$(document).ready(function () {
    const url = 'http://localhost:3000/'; // Use your backend base URL

    const getCart = () => {
        let cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    const saveCart = (cart) => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    const getToken = () => {
        const userId = sessionStorage.getItem('userId');

        if (!userId) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return false;
        }
        return true;
    }

    $.ajax({
        method: "GET",
        url: `${url}api/v1/items`,
        dataType: 'json',
        success: function (data) {
            console.log(data.rows);
            $("#items").empty();

            let row;
            $.each(data.rows, function (key, value) {
                if (key % 4 === 0) {
                    row = $('<div class="row"></div>');
                    $("#items").append(row);
                }

                var item = `
                    <div class="col-md-3 mb-4">
                        <div class="card h-100">
                            <img src="${url}images/${value.product_image}" class="card-img-top" alt="${value.description}">
                            <div class="card-body">
                                <h5 class="card-title">${value.description}</h5>
                                <p class="card-text">₱ ${value.sell_price}</p>
                                <p class="card-text"><small class="text-muted">Stock: ${value.quantity ?? 0}</small></p>
                                <a href="#!" class="btn btn-primary show-details" role="button" 
                                    data-id="${value.item_id}"
                                    data-description="${value.description}"
                                    data-price="${value.sell_price}"
                                    data-image="${url}images/${value.product_image}"
                                    data-stock="${value.quantity ?? 0}">
                                    Details
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                row.append(item);
            });

            // Append modal HTML if it doesn't exist
            if ($('#productDetailsModal').length === 0) {
                $('body').append(`
                    <div class="modal fade" id="productDetailsModal" tabindex="-1" role="dialog" aria-labelledby="productDetailsModalLabel" aria-hidden="true">
                        <div class="modal-dialog modal-dialog-centered" role="document">
                            <div class="modal-content">
                                <div class="modal-header">
                                    <h5 class="modal-title" id="productDetailsModalLabel">Product Details</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div class="modal-body">
                                    <img id="modalImage" src="" class="img-fluid mb-3" alt="">
                                    <h5 id="modalDescription"></h5>
                                    <p>Price: ₱ <span id="modalPrice"></span></p>
                                    <p>Stock: <span id="modalStock"></span></p>
                                </div>
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-primary" id="addToCartBtn">Add to Cart</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            }

            let currentProduct = {};

            // Show modal details on click
            $('.show-details').click(function () {
                const image = $(this).data('image');
                const description = $(this).data('description');
                const price = $(this).data('price');
                const stock = $(this).data('stock');
                const itemId = $(this).data('id');

                // Store current product for Add to Cart
                currentProduct = {
                    id: itemId,
                    description: description,
                    price: parseFloat(price),
                    image: image,
                    quantity: 1
                };

                $('#modalImage').attr('src', image);
                $('#modalDescription').text(description);
                $('#modalPrice').text(price);
                $('#modalStock').text(stock);
                $('#addToCartBtn').data('id', itemId);

                $('#productDetailsModal').modal('show');
            });

            // Add to Cart handler
            $(document).on('click', '#addToCartBtn', function () {
                let cart = getCart();
                let existing = cart.find(item => item.id == currentProduct.id);
                if (existing) {
                    existing.quantity += 1;
                } else {
                    cart.push(currentProduct);
                }
                saveCart(cart);
                Swal.fire('Added!', 'Product added to cart.', 'success');
                $('#productDetailsModal').modal('hide');
            });
        },
        error: function (err) {
            console.error("Error fetching items:", err);
        }
    });
});
