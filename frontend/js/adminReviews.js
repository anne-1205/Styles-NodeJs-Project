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

    function fetchReviews() {
        $.ajax({
            url: 'http://localhost:3000/api/v1/admin/reviews',
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token },
            success: function (data) {
                if (data.success) {
                    populateReviewsTable(data.reviews);
                } else {
                    console.error('Error fetching reviews:', data.message);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Error fetching reviews'
                    });
                }
            },
            error: function (xhr) {
                if (xhr.status === 401) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Session Expired',
                        text: 'Please login again.'
                    }).then(() => {
                        window.location.href = 'login.html';
                    });
                } else if (xhr.status === 403) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Access Denied',
                        text: 'Admin privileges required.'
                    }).then(() => {
                        window.location.href = 'home.html';
                    });
                } else {
                    console.error('Error fetching reviews:', xhr);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to fetch reviews. Please try again.'
                    });
                }
            }
        });
    }

    function populateReviewsTable(reviews) {
        if ($.fn.DataTable.isDataTable('#reviewsTable')) {
            $('#reviewsTable').DataTable().destroy();
        }

        const table = $('#reviewsTable').DataTable({
            data: reviews,
            columns: [
                { data: 'id' },
                { 
                    data: 'user_name',
                    render: function(data, type, row) {
                        return `<div>
                            <strong>${data}</strong><br>
                            <small>${row.user_email}</small>
                        </div>`;
                    }
                },
                { 
                    data: 'item_name',
                    render: function(data, type, row) {
                        return `<div>
                            <strong>${data}</strong><br>
                            <small>Order #${row.orderinfo_id}</small>
                        </div>`;
                    }
                },
                { 
                    data: 'rating',
                    render: function(data, type, row) {
                        let stars = '';
                        for (let i = 1; i <= 5; i++) {
                            if (i <= data) {
                                stars += '<i class="fas fa-star" style="color: #ffd700;"></i>';
                            } else {
                                stars += '<i class="far fa-star" style="color: #ccc;"></i>';
                            }
                        }
                        return `<div class="review-rating">
                            ${stars}<br>
                            <small>${data}/5</small>
                        </div>`;
                    }
                },
                { 
                    data: 'comment',
                    render: function(data, type, row) {
                        return data ? data.substring(0, 100) + (data.length > 100 ? '...' : '') : 'No comment';
                    }
                },
                { 
                    data: 'created_at',
                    render: function(data, type, row) {
                        return new Date(data).toLocaleDateString();
                    }
                },
                { 
                    data: 'id',
                    render: function(data, type, row) {
                        return `<button class="delete-review-btn" onclick="deleteReview(${data})">
                            <i class="fas fa-trash"></i> Delete
                        </button>`;
                    }
                }
            ],
            paging: true,
            searching: true,
            ordering: true,
            responsive: true,
            dom: 'Bfrtip',
            buttons: ['copy', 'csv', 'excel', 'pdf'],
            pageLength: 10,
            order: [[5, 'desc']] // Sort by date descending
        });
    }

    // Global function for deleting reviews
    window.deleteReview = function(reviewId) {
        Swal.fire({
            title: 'Delete Review',
            text: 'Are you sure you want to delete this review? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `http://localhost:3000/api/v1/admin/reviews/${reviewId}`,
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token },
                    success: function (data) {
                        if (data.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Review Deleted!',
                                text: 'The review has been deleted successfully.',
                                timer: 2000,
                                showConfirmButton: false
                            });
                            fetchReviews(); // Refresh the table
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: data.message || 'Error deleting review'
                            });
                        }
                    },
                    error: function (xhr) {
                        if (xhr.status === 401) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Session Expired',
                                text: 'Please login again.'
                            }).then(() => {
                                window.location.href = 'login.html';
                            });
                        } else if (xhr.status === 403) {
                            Swal.fire({
                                icon: 'error',
                                title: 'Access Denied',
                                text: 'Admin privileges required.'
                            }).then(() => {
                                window.location.href = 'home.html';
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Failed to delete review. Please try again.'
                            });
                        }
                    }
                });
            }
        });
    };

    // Initialize reviews table
    fetchReviews();

    // Refresh reviews every 30 seconds to catch updates
    setInterval(fetchReviews, 30000);
}); 