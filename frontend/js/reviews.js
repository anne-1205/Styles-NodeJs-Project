// Review System JavaScript

class ReviewSystem {
    constructor() {
        this.currentRating = 0;
        this.currentItemId = null;
        this.currentOrderId = null;
        this.existingReview = null;
    }

    // Initialize star rating system
    initStarRating(containerId, initialRating = 0) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="star-rating">
                <i class="fas fa-star" data-rating="1"></i>
                <i class="fas fa-star" data-rating="2"></i>
                <i class="fas fa-star" data-rating="3"></i>
                <i class="fas fa-star" data-rating="4"></i>
                <i class="fas fa-star" data-rating="5"></i>
            </div>
        `;

        const stars = container.querySelectorAll('.fa-star');
        stars.forEach(star => {
            star.addEventListener('mouseenter', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.highlightStars(stars, rating);
            });

            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.currentRating = rating;
                this.highlightStars(stars, rating, true);
            });
        });

        container.addEventListener('mouseleave', () => {
            this.highlightStars(stars, this.currentRating);
        });

        // Set initial rating if provided
        if (initialRating > 0) {
            this.currentRating = initialRating;
            this.highlightStars(stars, initialRating, true);
        }
    }

    // Highlight stars based on rating
    highlightStars(stars, rating, permanent = false) {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#ffd700';
                star.classList.add('active');
            } else {
                star.style.color = '#ccc';
                star.classList.remove('active');
            }
        });
    }

    // Check if user has already reviewed this item from this order
    async checkExistingReview(itemId, orderId) {
        const token = sessionStorage.getItem('token');
        if (!token) return null;

        try {
            const response = await fetch(`http://localhost:3000/api/v1/user/reviews`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const data = await response.json();
            
            if (data.success && data.reviews) {
                return data.reviews.find(review => 
                    review.item_id == itemId && review.orderinfo_id == orderId
                );
            }
        } catch (error) {
            console.error('Error checking existing review:', error);
        }
        return null;
    }

    // Display reviews for a product
    displayReviews(itemId, containerId) {
        this.currentItemId = itemId;
        const container = document.getElementById(containerId);
        if (!container) return;

        $.ajax({
            url: `http://localhost:3000/api/v1/items/${itemId}/reviews`,
            method: 'GET',
            success: (data) => {
                if (data.success) {
                    this.renderReviews(data.reviews, data.average_rating, data.total_reviews, container);
                }
            },
            error: (error) => {
                console.error('Error fetching reviews:', error);
                container.innerHTML = '<p>Error loading reviews</p>';
            }
        });
    }

    // Render reviews in container
    renderReviews(reviews, averageRating, totalReviews, container) {
        let html = `
            <div class="reviews-header">
                <h3>Customer Reviews (${totalReviews})</h3>
                <div class="average-rating">
                    <span class="rating-stars">
                        ${this.generateStarHTML(averageRating)}
                    </span>
                    <span class="rating-text">${averageRating} out of 5</span>
                </div>
            </div>
        `;

        if (reviews.length === 0) {
            html += '<p>No reviews yet. Be the first to review this product!</p>';
        } else {
            html += '<div class="reviews-list">';
            reviews.forEach(review => {
                html += this.generateReviewHTML(review);
            });
            html += '</div>';
        }

        container.innerHTML = html;
    }

    // Generate star HTML
    generateStarHTML(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                html += '<i class="fas fa-star" style="color: #ffd700;"></i>';
            } else {
                html += '<i class="fas fa-star" style="color: #ccc;"></i>';
            }
        }
        return html;
    }

    // Generate individual review HTML
    generateReviewHTML(review) {
        const date = new Date(review.created_at).toLocaleDateString();
        const isOwnReview = review.user_id == this.getCurrentUserId();
        
        return `
            <div class="review-item ${isOwnReview ? 'own-review' : ''}">
                <div class="review-header">
                    <div class="reviewer-info">
                        <img src="${review.profile_picture || '/images/default-avatar.png'}" alt="User" class="reviewer-avatar">
                        <span class="reviewer-name">${review.user_name}</span>
                        ${isOwnReview ? '<span class="own-review-badge">Your Review</span>' : ''}
                    </div>
                    <div class="review-rating">
                        ${this.generateStarHTML(review.rating)}
                        <span class="review-date">${date}</span>
                    </div>
                </div>
                <div class="review-comment">
                    <p>${review.comment || 'No comment provided'}</p>
                </div>
                ${isOwnReview ? `
                    <div class="review-actions">
                        <button class="btn btn-sm btn-primary" onclick="reviewSystem.editReview(${review.id}, ${review.rating}, '${review.comment || ''}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="reviewSystem.deleteReview(${review.id})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Get current user ID from token
    getCurrentUserId() {
        const token = sessionStorage.getItem('token');
        if (!token) return null;
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.id;
        } catch (error) {
            console.error('Error parsing token:', error);
            return null;
        }
    }

    // Show review form
    async showReviewForm(itemId, orderId, containerId) {
        this.currentItemId = itemId;
        this.currentOrderId = orderId;
        const container = document.getElementById(containerId);
        if (!container) return;

        const token = sessionStorage.getItem('token');
        if (!token) {
            alert('Please login to leave a review');
            window.location.href = 'login.html';
            return;
        }

        // Check for existing review
        this.existingReview = await this.checkExistingReview(itemId, orderId);
        
        if (this.existingReview) {
            // Show edit form
            this.showEditForm(container);
        } else {
            // Show new review form
            this.showNewReviewForm(container);
        }
    }

    // Show new review form
    showNewReviewForm(container) {
        container.innerHTML = `
            <div class="review-form">
                <h3>Leave a Review</h3>
                <div class="form-group">
                    <label>Rating:</label>
                    <div id="reviewStarRating" class="star-rating-container"></div>
                </div>
                <div class="form-group">
                    <label for="reviewComment">Comment:</label>
                    <textarea id="reviewComment" rows="4" placeholder="Share your experience with this product..."></textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="reviewSystem.submitReview()">Submit Review</button>
                    <button type="button" class="btn btn-secondary" onclick="reviewSystem.cancelReview()">Cancel</button>
                </div>
            </div>
        `;

        this.initStarRating('reviewStarRating');
    }

    // Show edit form
    showEditForm(container) {
        container.innerHTML = `
            <div class="review-form">
                <h3>Edit Your Review</h3>
                <div class="form-group">
                    <label>Rating:</label>
                    <div id="reviewStarRating" class="star-rating-container"></div>
                </div>
                <div class="form-group">
                    <label for="reviewComment">Comment:</label>
                    <textarea id="reviewComment" rows="4" placeholder="Share your experience with this product...">${this.existingReview.comment || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-primary" onclick="reviewSystem.updateReview()">Update Review</button>
                    <button type="button" class="btn btn-secondary" onclick="reviewSystem.cancelReview()">Cancel</button>
                </div>
            </div>
        `;

        this.initStarRating('reviewStarRating', this.existingReview.rating);
    }

    // Submit new review
    submitReview() {
        const comment = document.getElementById('reviewComment').value;
        const token = sessionStorage.getItem('token');

        if (this.currentRating === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Rating Required',
                text: 'Please select a rating before submitting your review.'
            });
            return;
        }

        $.ajax({
            url: 'http://localhost:3000/api/v1/reviews',
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            contentType: 'application/json',
            data: JSON.stringify({
                item_id: this.currentItemId,
                order_id: this.currentOrderId,
                rating: this.currentRating,
                comment: comment
            }),
            success: (data) => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Review Submitted!',
                        text: 'Your review has been submitted successfully.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    this.currentRating = 0;
                    this.existingReview = null;
                    // Refresh reviews display
                    this.displayReviews(this.currentItemId, 'reviewsContainer');
                    // Refresh orders if on orders page
                    if (typeof fetchOrders === 'function') {
                        fetchOrders();
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Error submitting review'
                    });
                }
            },
            error: (error) => {
                let errorMessage = 'Error submitting review';
                if (error.responseJSON?.message) {
                    errorMessage = error.responseJSON.message;
                } else if (error.status === 400) {
                    errorMessage = 'You have already reviewed this item from this order. Please edit your existing review instead.';
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Review Error',
                    text: errorMessage
                });
            }
        });
    }

    // Update existing review
    updateReview() {
        const comment = document.getElementById('reviewComment').value;
        const token = sessionStorage.getItem('token');

        if (this.currentRating === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Rating Required',
                text: 'Please select a rating before updating your review.'
            });
            return;
        }

        if (!this.existingReview) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No existing review found to update.'
            });
            return;
        }

        $.ajax({
            url: `http://localhost:3000/api/v1/reviews/${this.existingReview.id}`,
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            contentType: 'application/json',
            data: JSON.stringify({
                rating: this.currentRating,
                comment: comment
            }),
            success: (data) => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Review Updated!',
                        text: 'Your review has been updated successfully.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    this.currentRating = 0;
                    this.existingReview = null;
                    // Refresh reviews display
                    this.displayReviews(this.currentItemId, 'reviewsContainer');
                    // Refresh orders if on orders page
                    if (typeof fetchOrders === 'function') {
                        fetchOrders();
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Error updating review'
                    });
                }
            },
            error: (error) => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.responseJSON?.message || 'Error updating review'
                });
            }
        });
    }

    // Edit review (called from review display)
    editReview(reviewId, currentRating, currentComment) {
        this.existingReview = { id: reviewId, rating: currentRating, comment: currentComment };
        this.currentRating = currentRating;
        
        // Show edit modal
        this.showEditModal();
    }

    // Show edit modal
    showEditModal() {
        const modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.innerHTML = `
            <div class="review-modal-content">
                <div class="review-modal-header">
                    <h3>Edit Your Review</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="review-modal-body">
                    <div class="form-group">
                        <label>Rating:</label>
                        <div id="modalStarRating" class="star-rating-container"></div>
                    </div>
                    <div class="form-group">
                        <label for="modalReviewComment">Comment:</label>
                        <textarea id="modalReviewComment" rows="4" placeholder="Share your experience with this product...">${this.existingReview.comment || ''}</textarea>
                    </div>
                </div>
                <div class="review-modal-footer">
                    <button type="button" class="btn btn-primary" onclick="reviewSystem.submitModalUpdate()">Update Review</button>
                    <button type="button" class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.initStarRating('modalStarRating', this.existingReview.rating);
    }

    // Submit modal update
    submitModalUpdate() {
        const comment = document.getElementById('modalReviewComment').value;
        const token = sessionStorage.getItem('token');

        if (this.currentRating === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Rating Required',
                text: 'Please select a rating before updating your review.'
            });
            return;
        }

        $.ajax({
            url: `http://localhost:3000/api/v1/reviews/${this.existingReview.id}`,
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            contentType: 'application/json',
            data: JSON.stringify({
                rating: this.currentRating,
                comment: comment
            }),
            success: (data) => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Review Updated!',
                        text: 'Your review has been updated successfully.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    this.currentRating = 0;
                    this.existingReview = null;
                    // Close modal
                    document.querySelector('.review-modal').remove();
                    // Refresh orders page if on orders page
                    if (typeof fetchOrders === 'function') {
                        fetchOrders();
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Error updating review'
                    });
                }
            },
            error: (error) => {
                let errorMessage = 'Error updating review';
                if (error.responseJSON?.message) {
                    errorMessage = error.responseJSON.message;
                } else if (error.status === 400) {
                    errorMessage = 'You have already reviewed this item from this order. Please edit your existing review instead.';
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Review Error',
                    text: errorMessage
                });
            }
        });
    }

    // Delete review
    deleteReview(reviewId) {
        Swal.fire({
            title: 'Delete Review',
            text: 'Are you sure you want to delete your review? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                const token = sessionStorage.getItem('token');
                
                $.ajax({
                    url: `http://localhost:3000/api/v1/reviews/${reviewId}`,
                    method: 'DELETE',
                    headers: { 'Authorization': 'Bearer ' + token },
                    success: (data) => {
                        if (data.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Review Deleted!',
                                text: 'Your review has been deleted successfully.',
                                timer: 2000,
                                showConfirmButton: false
                            });
                            // Refresh orders page if on orders page
                            if (typeof fetchOrders === 'function') {
                                fetchOrders();
                            }
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: data.message || 'Error deleting review'
                            });
                        }
                    },
                    error: (error) => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: error.responseJSON?.message || 'Error deleting review'
                        });
                    }
                });
            }
        });
    }

    // Cancel review
    cancelReview() {
        this.currentRating = 0;
        this.existingReview = null;
        this.displayReviews(this.currentItemId, 'reviewsContainer');
    }

    // Show review modal for orders
    async showReviewModal(itemId, orderId, itemName) {
        const token = sessionStorage.getItem('token');
        if (!token) {
            Swal.fire({
                icon: 'warning',
                title: 'Login Required',
                text: 'Please login to leave a review'
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }

        this.currentItemId = itemId;
        this.currentOrderId = orderId;

        // Check for existing review
        this.existingReview = await this.checkExistingReview(itemId, orderId);

        const modal = document.createElement('div');
        modal.className = 'review-modal';
        modal.innerHTML = `
            <div class="review-modal-content">
                <div class="review-modal-header">
                    <h3>${this.existingReview ? 'Edit' : 'Review'}: ${itemName}</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="review-modal-body">
                    <div class="form-group">
                        <label>Rating:</label>
                        <div id="modalStarRating" class="star-rating-container"></div>
                    </div>
                    <div class="form-group">
                        <label for="modalReviewComment">Comment:</label>
                        <textarea id="modalReviewComment" rows="4" placeholder="Share your experience with this product...">${this.existingReview ? (this.existingReview.comment || '') : ''}</textarea>
                    </div>
                </div>
                <div class="review-modal-footer">
                    <button type="button" class="btn btn-primary" onclick="reviewSystem.submitModalReview()">
                        ${this.existingReview ? 'Update' : 'Submit'} Review
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.initStarRating('modalStarRating', this.existingReview ? this.existingReview.rating : 0);
    }

    // Submit modal review
    submitModalReview() {
        const comment = document.getElementById('modalReviewComment').value;
        const token = sessionStorage.getItem('token');

        if (this.currentRating === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Rating Required',
                text: 'Please select a rating before submitting your review.'
            });
            return;
        }

        const url = this.existingReview 
            ? `http://localhost:3000/api/v1/reviews/${this.existingReview.id}`
            : 'http://localhost:3000/api/v1/reviews';
        
        const method = this.existingReview ? 'PUT' : 'POST';
        const data = this.existingReview 
            ? { rating: this.currentRating, comment: comment }
            : {
                item_id: this.currentItemId,
                order_id: this.currentOrderId,
                rating: this.currentRating,
                comment: comment
            };

        $.ajax({
            url: url,
            method: method,
            headers: { 'Authorization': 'Bearer ' + token },
            contentType: 'application/json',
            data: JSON.stringify(data),
            success: (data) => {
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: this.existingReview ? 'Review Updated!' : 'Review Submitted!',
                        text: this.existingReview 
                            ? 'Your review has been updated successfully.'
                            : 'Your review has been submitted successfully.',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    this.currentRating = 0;
                    this.existingReview = null;
                    // Close modal
                    document.querySelector('.review-modal').remove();
                    // Refresh orders page if on orders page
                    if (typeof fetchOrders === 'function') {
                        fetchOrders();
                    }
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'Error submitting review'
                    });
                }
            },
            error: (error) => {
                let errorMessage = 'Error submitting review';
                if (error.responseJSON?.message) {
                    errorMessage = error.responseJSON.message;
                } else if (error.status === 400) {
                    errorMessage = 'You have already reviewed this item from this order. Please edit your existing review instead.';
                }
                Swal.fire({
                    icon: 'error',
                    title: 'Review Error',
                    text: errorMessage
                });
            }
        });
    }
}

// Initialize global review system
const reviewSystem = new ReviewSystem();

// Add CSS for review system
const reviewCSS = `
<style>
.reviews-header {
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #eee;
}

.average-rating {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
}

.rating-stars {
    font-size: 18px;
}

.rating-text {
    font-weight: bold;
    color: #333;
}

.reviews-list {
    max-height: 400px;
    overflow-y: auto;
}

.review-item {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    background: #f9f9f9;
}

.review-item.own-review {
    border-left: 4px solid #ff69b4;
    background: #fff5f8;
}

.own-review-badge {
    background: #ff69b4;
    color: white;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    margin-left: 8px;
}

.review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.reviewer-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.reviewer-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    object-fit: cover;
}

.reviewer-name {
    font-weight: bold;
    color: #333;
}

.review-rating {
    display: flex;
    align-items: center;
    gap: 10px;
}

.review-date {
    color: #666;
    font-size: 12px;
}

.review-comment {
    color: #333;
    line-height: 1.5;
}

.review-actions {
    margin-top: 10px;
    display: flex;
    gap: 8px;
}

.btn-sm {
    padding: 4px 8px;
    font-size: 12px;
}

.btn-danger {
    background: #dc3545;
    color: white;
}

.btn-danger:hover {
    background: #c82333;
}

.review-form {
    background: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #eee;
}

.form-group {
    margin-bottom: 15px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #333;
}

.form-group textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    resize: vertical;
}

.form-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.star-rating-container {
    display: flex;
    gap: 5px;
}

.star-rating .fa-star {
    font-size: 24px;
    cursor: pointer;
    transition: color 0.2s;
}

.star-rating .fa-star:hover {
    color: #ffd700;
}

.review-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.review-modal-content {
    background: white;
    border-radius: 8px;
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
}

.review-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #eee;
}

.review-modal-header h3 {
    margin: 0;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.review-modal-body {
    padding: 20px;
}

.review-modal-footer {
    padding: 20px;
    border-top: 1px solid #eee;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.2s;
}

.btn-primary {
    background: #ff69b4;
    color: white;
}

.btn-primary:hover {
    background: #e754a0;
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #5a6268;
}

.review-btn {
    background: #ff69b4;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 12px;
    margin-top: 5px;
}

.review-btn:hover {
    background: #e754a0;
}

.review-btn:disabled {
    background: #ccc;
    cursor: not-allowed;
}
</style>
`;

// Inject CSS
document.head.insertAdjacentHTML('beforeend', reviewCSS); 