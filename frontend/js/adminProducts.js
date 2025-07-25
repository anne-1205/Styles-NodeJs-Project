$(document).ready(function () {
    let token = sessionStorage.getItem('token');
    if (!token) window.location.href = 'login.html';

    function fetchProducts() {
        $.get('http://localhost:3000/api/v1/items', function (data) {
            let html = '';
            data.rows.forEach(item => {
                html += `<tr>
                    <td>${item.item_id}</td>
                    <td>${item.description}</td>
                    <td>${item.category || ''}</td>
                    <td>${item.cost_price}</td>
                    <td>${item.sell_price}</td>
                    <td>${item.quantity}</td>
                    <td><img src="/images/${item.product_image}" width="54" height="54" style="border-radius:8px;object-fit:cover;"></td>
                    <td>
                        <button class="editBtn">✏️</button>
                        <button class="deleteBtn">🗑️</button>
                    </td>
                </tr>`;
            });
            $('#productTable tbody').html(html);
        });
    }
    fetchProducts();

    $('#addProductBtn').on('click', function () {
        $('#productForm').show();
        $('#productId').val('');
        $('#description, #cost_price, #sell_price, #quantity').val('');
        $('#category').val('');
    });

    $('#cancelProductBtn').on('click', function () {
        $('#productForm').hide();
    });

    $('#saveProductBtn').on('click', function () {
        let id = $('#productId').val();
        let formData = new FormData();
        formData.append('description', $('#description').val());
        formData.append('category', $('#category').val());
        formData.append('cost_price', $('#cost_price').val());
        formData.append('sell_price', $('#sell_price').val());
        formData.append('quantity', $('#quantity').val());
        if ($('#product_image')[0].files[0]) {
            formData.append('product_image', $('#product_image')[0].files[0]);
        }
        let method = id ? 'PUT' : 'POST';
        let url = id ? `http://localhost:3000/api/v1/items/${id}` : 'http://localhost:3000/api/v1/items';
        $.ajax({
            method: method,
            url: url,
            headers: { Authorization: "Bearer " + token },
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                $('#productForm').hide();
                fetchProducts();
            }
        });
    });

    $(document).on('click', '.editBtn', function () {
        let id = $(this).closest('tr').find('td:first').text(); // Get ID from the first cell
        $.get(`http://localhost:3000/api/v1/items/${id}`, function (data) {
            let item = data.result[0];
            $('#productId').val(item.item_id);
            $('#description').val(item.description);
            $('#category').val(item.category || '');
            $('#cost_price').val(item.cost_price);
            $('#sell_price').val(item.sell_price);
            $('#quantity').val(item.quantity);
            $('#productForm').show();
        });
    });

    $(document).on('click', '.deleteBtn', function () {
        let id = $(this).closest('tr').find('td:first').text(); // Get ID from the first cell
        if (confirm('Delete this product?')) {
            $.ajax({
                method: 'DELETE',
                url: `http://localhost:3000/api/v1/items/${id}`,
                headers: { Authorization: "Bearer " + token },
                success: fetchProducts
            });
        }
    });

    $('#logoutBtn').on('click', function() {
        sessionStorage.clear();
        window.location.href = 'login.html';
    });
});
