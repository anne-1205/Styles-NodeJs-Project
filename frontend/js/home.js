$(document).ready(function () {
    const url = 'http://localhost:3000/';

    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;
    const productsPerPage = 8;
    let loading = false;
    let searchTimeout;

    // Enhanced search and autocomplete functionality
    function initializeSearch() {
        const searchBox = $('#searchBox');
        const autocompleteDropdown = $('#autocompleteDropdown');
        
        // Debounced search function
        function performSearch(query) {
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            searchTimeout = setTimeout(() => {
                if (query.length < 2) {
                    filteredProducts = allProducts;
                    autocompleteDropdown.hide();
                    renderProducts();
                    return;
                }

                // Search in product names, categories, and descriptions
                filteredProducts = allProducts.filter(product => {
                    const searchTerm = query.toLowerCase();
                    const productName = product.description.toLowerCase();
                    const category = (product.category || '').toLowerCase();
                    
                    return productName.includes(searchTerm) || 
                           category.includes(searchTerm) ||
                           productName.split(' ').some(word => word.startsWith(searchTerm)) ||
                           category.split(' ').some(word => word.startsWith(searchTerm));
                });

                // Generate autocomplete suggestions
                const suggestions = generateAutocompleteSuggestions(query);
                showAutocompleteSuggestions(suggestions);
                renderProducts();
            }, 300);
        }

        // Generate autocomplete suggestions
        function generateAutocompleteSuggestions(query) {
            const suggestions = new Set();
            const searchTerm = query.toLowerCase();
            
            allProducts.forEach(product => {
                const name = product.description.toLowerCase();
                const category = (product.category || '').toLowerCase();
                
                // Add matching product names
                if (name.includes(searchTerm)) {
                    const words = name.split(' ');
                    words.forEach(word => {
                        if (word.startsWith(searchTerm) && word.length > searchTerm.length) {
                            suggestions.add(word);
                        }
                    });
                }
                
                // Add matching categories
                if (category.includes(searchTerm)) {
                    suggestions.add(category);
                }
            });
            
            return Array.from(suggestions).slice(0, 8);
        }

        // Show autocomplete suggestions
        function showAutocompleteSuggestions(suggestions) {
            if (suggestions.length === 0) {
                autocompleteDropdown.hide();
                return;
            }

            let html = '';
            suggestions.forEach((suggestion, index) => {
                html += `<div class="autocomplete-item" data-index="${index}" data-value="${suggestion}">
                    <i class="fas fa-search"></i> ${suggestion}
                </div>`;
            });
            
            autocompleteDropdown.html(html).show();
        }

        // Real-time search
        searchBox.on('input', function() {
            const query = $(this).val();
            performSearch(query);
        });

        // Enhanced autocomplete selection
        $(document).on('click', '#autocompleteDropdown .autocomplete-item', function() {
            const selectedValue = $(this).data('value');
            searchBox.val(selectedValue);
            autocompleteDropdown.hide();
            performSearch(selectedValue);
        });

        // Keyboard navigation for autocomplete
        let selectedAutocompleteIndex = -1;
        
        searchBox.on('keydown', function(e) {
            const itemCount = $('#autocompleteDropdown .autocomplete-item').length;
            
            switch(e.keyCode) {
                case 40: // Down arrow
                    e.preventDefault();
                    selectedAutocompleteIndex = (selectedAutocompleteIndex + 1) % itemCount;
                    selectAutocompleteItem(selectedAutocompleteIndex);
                    break;
                case 38: // Up arrow
                    e.preventDefault();
                    selectedAutocompleteIndex = selectedAutocompleteIndex <= 0 ? itemCount - 1 : selectedAutocompleteIndex - 1;
                    selectAutocompleteItem(selectedAutocompleteIndex);
                    break;
                case 13: // Enter
                    e.preventDefault();
                    applyAutocompleteSelection();
                    break;
                case 27: // Escape
                    autocompleteDropdown.hide();
                    selectedAutocompleteIndex = -1;
                    break;
            }
        });

        function selectAutocompleteItem(index) {
            $('#autocompleteDropdown .autocomplete-item').removeClass('selected');
            $(`#autocompleteDropdown .autocomplete-item[data-index="${index}"]`).addClass('selected');
        }

        function applyAutocompleteSelection() {
            const selectedItem = $('#autocompleteDropdown .autocomplete-item.selected');
            if (selectedItem.length > 0) {
                const selectedValue = selectedItem.data('value');
                searchBox.val(selectedValue);
                autocompleteDropdown.hide();
                performSearch(selectedValue);
            }
        }

        // Hide autocomplete when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#searchBox, #autocompleteDropdown').length) {
                autocompleteDropdown.hide();
            }
        });

        // Hover effects for autocomplete items
        $(document).on('mouseenter', '#autocompleteDropdown .autocomplete-item', function() {
            $('#autocompleteDropdown .autocomplete-item').removeClass('selected');
            $(this).addClass('selected');
            selectedAutocompleteIndex = $(this).data('index');
        });
    }

    // Fetch products and render
    function fetchAndRenderProducts() {
        $.ajax({
            method: "GET",
            url: `${url}api/v1/items`,
            dataType: 'json',
            success: function (data) {
                allProducts = data.rows || [];
                filteredProducts = allProducts;
                currentPage = 1;
                renderProducts();
                initializeSearch(); // Initialize search after products are loaded
            },
            error: function (err) {
                console.error("Error fetching items:", err);
            }
        });
    }

    function renderProducts() {
        const container = $('#products');
        container.html('');
        $('#pagination').remove();
        
        if (filteredProducts.length === 0) {
            container.html('<p style="color:#ff69b4;text-align:center;width:100%;">No products found.</p>');
            return;
        }
        
        // Pagination logic
        const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
        if (currentPage > totalPages) currentPage = 1;
        const start = (currentPage - 1) * productsPerPage;
        const end = start + productsPerPage;
        const pageProducts = filteredProducts.slice(start, end);
        
        pageProducts.forEach(item => {
            container.append(`
                <div class="card" data-category="${item.category || ''}" data-id="${item.item_id}">
                    <img src="/images/${item.product_image}" alt="${item.description}">
                    <h3>${item.description}</h3>
                    <p>${item.category ? item.category.charAt(0).toUpperCase() + item.category.slice(1) : ''}</p>
                    <p>₱${item.sell_price}</p>
                    <button class="btn add-to-cart" data-id="${item.item_id}" data-name="${item.description}" data-price="${item.sell_price}" data-image="/images/${item.product_image}">Add to Cart</button>
                    <button class="btn show-more" data-id="${item.item_id}" style="margin-top:8px;background:#000;color:#ff69b4;border:2px solid #ff69b4;">Show More</button>
                </div>
            `);
        });
        
        // Enhanced pagination controls with infinite scroll option
        if (totalPages > 1) {
            let paginationHtml = '<div id="pagination" style="text-align:center;margin-top:24px;">';
            
            // Previous button
            if (currentPage > 1) {
                paginationHtml += `<button class="btn" style="margin:0 4px;" data-page="${currentPage - 1}">← Previous</button>`;
            }
            
            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    paginationHtml += `<button class="btn" style="margin:0 4px;${i===currentPage?'background:#ff69b4;color:#fff;':''}" data-page="${i}">${i}</button>`;
                } else if (i === currentPage - 3 || i === currentPage + 3) {
                    paginationHtml += `<span style="margin:0 4px;color:#ff69b4;">...</span>`;
                }
            }
            
            // Next button
            if (currentPage < totalPages) {
                paginationHtml += `<button class="btn" style="margin:0 4px;" data-page="${currentPage + 1}">Next →</button>`;
            }
            
            paginationHtml += '</div>';
            container.after(paginationHtml);
        }
    }

    // Enhanced infinite scroll
    function initializeInfiniteScroll() {
        let isLoading = false;
        
        $(window).on('scroll', function() {
            if (isLoading) return;
            
            const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
            const scrollPosition = $(window).scrollTop() + $(window).height();
            const documentHeight = $(document).height();
            
            // Load more when user is 200px from bottom
            if (scrollPosition > documentHeight - 200) {
                if (currentPage < totalPages) {
                    isLoading = true;
                    
                    // Show loading indicator
                    $('#products').append('<div id="loading-indicator" style="text-align:center;padding:20px;color:#ff69b4;"><i class="fas fa-spinner fa-spin"></i> Loading more products...</div>');
                    
                    setTimeout(() => {
                        currentPage++;
                        renderProducts();
                        isLoading = false;
                        $('#loading-indicator').remove();
                    }, 500);
                }
            }
        });
    }

    // Show More button handler for custom modal
    $(document).on('click', '.show-more', function (e) {
        e.stopPropagation();
        const itemId = $(this).data('id');
        const product = allProducts.find(p => p.item_id == itemId);
        if (!product) return;
        
        // Populate modal
        $('#modalProductImage').attr('src', `/images/${product.product_image}`);
        $('#modalProductName').text(product.description);
        $('#modalProductCategory').text(product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1) : '');
        $('#modalProductPrice').text('₱' + product.sell_price);
        $('#modalProductStock').text('Stock: ' + (product.quantity ?? ''));
        $('#modalAddToCart').data('id', product.item_id).data('name', product.description).data('price', product.sell_price).data('image', `/images/${product.product_image}`);
        
        // Load reviews if reviewSystem exists
        if (typeof reviewSystem !== 'undefined') {
            reviewSystem.displayReviews(product.item_id, 'modalProductReviews');
        } else {
            $('#modalProductReviews').html('');
        }
        
        // Show modal
        $('#productModalOverlay').css('display', 'flex');
    });

    // Close modal
    $(document).on('click', '#closeProductModal', function () {
        $('#productModalOverlay').hide();
    });

    // Add to Cart from modal
    $(document).on('click', '#modalAddToCart', function () {
        const id = $(this).data('id');
        const name = $(this).data('name');
        const price = parseFloat($(this).data('price'));
        const image = $(this).data('image');
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        let existing = cart.find(item => item.id == id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ id, name, price, image, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Show custom notification modal
        $('#notificationMessage').text('Added to cart!');
        $('#notificationModal').fadeIn(300);
        $('#productModalOverlay').hide();
    });

    // Pagination click
    $(document).on('click', '#pagination button', function() {
        currentPage = parseInt($(this).data('page'));
        renderProducts();
    });

    // Add to Cart
    $(document).on('click', '.add-to-cart', function () {
        const id = $(this).data('id');
        const name = $(this).data('name');
        const price = parseFloat($(this).data('price'));
        const image = $(this).data('image');
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        let existing = cart.find(item => item.id == id);
        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({ id, name, price, image, quantity: 1 });
        }
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Show custom notification modal
        $('#notificationMessage').text('Added to cart!');
        $('#notificationModal').fadeIn(300);
    });

    // Close notification modal
    $('#notificationClose').on('click', function() {
        $('#notificationModal').fadeOut(300);
    });

    // Close notification modal when clicking outside
    $(document).on('click', function(e) {
        if ($(e.target).is('#notificationModal')) {
            $('#notificationModal').fadeOut(300);
        }
    });

    // Initialize everything
    fetchAndRenderProducts();
    initializeInfiniteScroll();
});
