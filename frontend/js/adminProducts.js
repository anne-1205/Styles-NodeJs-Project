$(document).ready(function () {
    let token = sessionStorage.getItem('token');
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Login Required',
            text: 'Please login to access admin panel.'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }

    function fetchProducts() {
        $.ajax({
            url: 'http://localhost:3000/api/v1/items',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                let html = '';
                if (data.rows && data.rows.length > 0) {
                    data.rows.forEach(item => {
                        html += `<tr>
                            <td>${item.item_id}</td>
                            <td>${item.description || ''}</td>
                            <td>${item.category || ''}</td>
                            <td>₱${item.cost_price || 0}</td>
                            <td>₱${item.sell_price || 0}</td>
                            <td>${item.quantity || 0}</td>
                            <td><img src="/images/${item.product_image || 'default.jpg'}" width="54" height="54" style="border-radius:8px;object-fit:cover;" onerror="this.src='/images/default.jpg'"></td>
                            <td>
                                <button class="editBtn" data-id="${item.item_id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="deleteBtn" data-id="${item.item_id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </td>
                        </tr>`;
                    });
                } else {
                    html = '<tr><td colspan="8" style="text-align:center;padding:20px;">No products found</td></tr>';
                }
                $('#productTable tbody').html(html);
            },
            error: function (xhr) {
                console.error('Error fetching products:', xhr);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load products. Please try again.'
                });
            }
        });
    }

    fetchProducts();

    $('#addProductBtn').on('click', function () {
        $('#productForm').slideDown();
        $('#productId').val('');
        $('#description, #cost_price, #sell_price, #quantity').val('');
        $('#category').val('');
        $('#product_image').val('');
        $('#saveProductBtn').text('Add Product');
    });

    $('#cancelProductBtn').on('click', function () {
        $('#productForm').slideUp();
    });

    $('#saveProductBtn').on('click', function () {
        let id = $('#productId').val();
        let description = $('#description').val().trim();
        let category = $('#category').val();
        let cost_price = $('#cost_price').val();
        let sell_price = $('#sell_price').val();
        let quantity = $('#quantity').val();

        // Validation
        if (!description) {
            Swal.fire({
                icon: 'warning',
                title: 'Description Required',
                text: 'Please enter a product description.'
            });
            return;
        }

        if (!category) {
            Swal.fire({
                icon: 'warning',
                title: 'Category Required',
                text: 'Please select a product category.'
            });
            return;
        }

        if (!cost_price || !sell_price || !quantity) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: 'Please fill in all price and quantity fields.'
            });
            return;
        }

        let formData = new FormData();
        formData.append('description', description);
        formData.append('category', category);
        formData.append('cost_price', cost_price);
        formData.append('sell_price', sell_price);
        formData.append('quantity', quantity);
        
        if ($('#product_image')[0].files[0]) {
            formData.append('product_image', $('#product_image')[0].files[0]);
        }

        let method = id ? 'PUT' : 'POST';
        let url = id ? `http://localhost:3000/api/v1/items/${id}` : 'http://localhost:3000/api/v1/items';

        // Show loading state
        $('#saveProductBtn').prop('disabled', true).text('Saving...');

        $.ajax({
            method: method,
            url: url,
            headers: { 'Authorization': 'Bearer ' + token },
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                $('#productForm').slideUp();
                fetchProducts();
                Swal.fire({
                    icon: 'success',
                    title: id ? 'Product Updated!' : 'Product Added!',
                    text: id ? 'Product has been updated successfully.' : 'Product has been added successfully.',
                    timer: 2000,
                    showConfirmButton: false
                });
            },
            error: function (xhr) {
                console.error('Error saving product:', xhr);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: xhr.responseJSON?.message || 'Failed to save product. Please try again.'
                });
            },
            complete: function () {
                $('#saveProductBtn').prop('disabled', false).text(id ? 'Update Product' : 'Add Product');
            }
        });
    });

    $(document).on('click', '.editBtn', function () {
        let id = $(this).data('id');
        if (!id) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not identify product. Please try again.'
            });
            return;
        }

        // Show loading state
        $(this).prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Loading...');

        $.ajax({
            url: `http://localhost:3000/api/v1/items/${id}`,
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                if (data.result && data.result.length > 0) {
                    let item = data.result[0];
                    $('#productId').val(item.item_id);
                    $('#description').val(item.description || '');
                    $('#category').val(item.category || '');
                    $('#cost_price').val(item.cost_price || '');
                    $('#sell_price').val(item.sell_price || '');
                    $('#quantity').val(item.quantity || '');
                    $('#productForm').slideDown();
                    $('#saveProductBtn').text('Update Product');
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Product Not Found',
                        text: 'Could not find the selected product.'
                    });
                }
            },
            error: function (xhr) {
                console.error('Error fetching product:', xhr);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to load product details. Please try again.'
                });
            },
            complete: function () {
                $('.editBtn').prop('disabled', false).html('<i class="fas fa-edit"></i> Edit');
            }
        });
    });

    $(document).on('click', '.deleteBtn', function () {
        let id = $(this).data('id');
        if (!id) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not identify product. Please try again.'
            });
            return;
        }

        Swal.fire({
            title: 'Delete Product',
            text: 'Are you sure you want to delete this product? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    method: 'DELETE',
                    url: `http://localhost:3000/api/v1/items/${id}`,
                    headers: { 'Authorization': 'Bearer ' + token },
                    success: function () {
                        fetchProducts();
                        Swal.fire({
                            icon: 'success',
                            title: 'Product Deleted!',
                            text: 'Product has been deleted successfully.',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    },
                    error: function (xhr) {
                        console.error('Error deleting product:', xhr);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: xhr.responseJSON?.message || 'Failed to delete product. Please try again.'
                        });
                    }
                });
            }
        });
    });

    $('#logoutBtn').on('click', function() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
});
