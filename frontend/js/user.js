$(document).ready(function () {
    const url = 'http://localhost:3000/';

    // Create a custom logger
    const logger = {
        group: function(label) {
            console.group('=== ' + label + ' ===');
        },
        error: function(message, data) {
            console.error('❌ ' + message);
            if (data) console.error(data);
        },
        info: function(message, data) {
            console.info('ℹ️ ' + message);
            if (data) console.info(data);
        },
        end: function() {
            console.groupEnd();
            console.log('\n'); // Add extra space for clarity
        }
    };

    // Enhanced validation functions
    const validators = {
        name: function(value) {
            if (!value || value.trim().length < 2) {
                return 'Name must be at least 2 characters long';
            }
            if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
                return 'Name can only contain letters and spaces';
            }
            return null;
        },
        email: function(value) {
            if (!value) {
                return 'Email is required';
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                return 'Please enter a valid email address';
            }
            return null;
        },
        password: function(value) {
            if (!value) {
                return 'Password is required';
            }
            if (value.length < 8) {
                return 'Password must be at least 8 characters long';
            }
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
            }
            return null;
        },
        confirmPassword: function(value, password) {
            if (!value) {
                return 'Please confirm your password';
            }
            if (value !== password) {
                return 'Passwords do not match';
            }
            return null;
        },
        profilePicture: function(file) {
            if (file) {
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
                const maxSize = 5 * 1024 * 1024; // 5MB
                
                if (!allowedTypes.includes(file.type)) {
                    return 'Please select a valid image file (JPEG, PNG, or GIF)';
                }
                if (file.size > maxSize) {
                    return 'Image file size must be less than 5MB';
                }
            }
            return null;
        }
    };

    // Real-time validation
    function validateField(fieldName, value, additionalData = null) {
        const validator = validators[fieldName];
        if (validator) {
            return validator(value, additionalData);
        }
        return null;
    }

    // Show validation error
    function showFieldError(fieldId, message) {
        const field = $(`#${fieldId}`);
        field.addClass('error');
        let errorDiv = field.siblings('.error-message');
        if (errorDiv.length === 0) {
            errorDiv = $('<div class="error-message" style="color: #ff6b6b; font-size: 12px; margin-top: 5px;"></div>');
            field.after(errorDiv);
        }
        errorDiv.text(message);
    }

    // Clear validation error
    function clearFieldError(fieldId) {
        const field = $(`#${fieldId}`);
        field.removeClass('error');
        field.siblings('.error-message').remove();
    }

    // Real-time validation for registration form
    $('#name').on('blur', function() {
        const error = validateField('name', $(this).val());
        if (error) {
            showFieldError('name', error);
        } else {
            clearFieldError('name');
        }
    });

    $('#email').on('blur', function() {
        const error = validateField('email', $(this).val());
        if (error) {
            showFieldError('email', error);
        } else {
            clearFieldError('email');
        }
    });

    $('#password').on('blur', function() {
        const error = validateField('password', $(this).val());
        if (error) {
            showFieldError('password', error);
        } else {
            clearFieldError('password');
        }
    });

    $('#confirmPassword').on('blur', function() {
        const error = validateField('confirmPassword', $(this).val(), $('#password').val());
        if (error) {
            showFieldError('confirmPassword', error);
        } else {
            clearFieldError('confirmPassword');
        }
    });

    $('#profilePicture').on('change', function() {
        const file = this.files[0];
        const error = validateField('profilePicture', file);
        if (error) {
            showFieldError('profilePicture', error);
        } else {
            clearFieldError('profilePicture');
        }
    });

    // Enhanced registration form validation
    $("#registerForm").on('submit', function (e) {
        e.preventDefault();
        
        // Clear console for better visibility
        console.clear();
        logger.group('Registration Attempt');
        
        // Log form data
        logger.info('Form Data:', {
            name: $("#name").val(),
            email: $("#email").val(),
            hasProfilePicture: $("#profilePicture")[0].files.length > 0
        });

        // Comprehensive validation
        let hasErrors = false;
        const validations = [
            { field: 'name', value: $("#name").val() },
            { field: 'email', value: $("#email").val() },
            { field: 'password', value: $("#password").val() },
            { field: 'confirmPassword', value: $("#confirmPassword").val(), additional: $("#password").val() },
            { field: 'profilePicture', value: $("#profilePicture")[0].files[0] }
        ];

        validations.forEach(validation => {
            const error = validateField(validation.field, validation.value, validation.additional);
            if (error) {
                showFieldError(validation.field, error);
                hasErrors = true;
                logger.error(`Validation Error (${validation.field}):`, error);
            } else {
                clearFieldError(validation.field);
            }
        });

        if (hasErrors) {
            logger.error('Validation Failed: Form has errors');
            logger.end();
            
            Swal.fire({
                icon: "error",
                text: "Please fix the validation errors before submitting",
                showConfirmButton: true
            });
            return;
        }

        const formData = new FormData();
        formData.append('name', $("#name").val());
        formData.append('email', $("#email").val());
        formData.append('password', $("#password").val());
        
        const profilePicture = $("#profilePicture")[0].files[0];
        if (profilePicture) {
            formData.append('image', profilePicture);
        }

        $.ajax({
            method: "POST",
            url: `${url}api/v1/register`,
            data: formData,
            processData: false,
            contentType: false,
            success: function (data) {
                logger.info('Registration Success:', data);
                logger.end();
                
                Swal.fire({
                    icon: "success",
                    text: "Registration successful!",
                    showConfirmButton: true
                }).then(() => {
                    window.location.href = 'login.html';
                });
            },
            error: function (error) {
                logger.error('Registration Failed');
                logger.error('Status:', error.status);
                logger.error('Response:', error.responseText);
                logger.end();

                Swal.fire({
                    icon: "error",
                    text: error.responseJSON?.message || "Registration failed",
                    showConfirmButton: true
                });
            }
        });
    });

    // Enhanced login form validation
    $("#loginForm").on('submit', function (e) {
        e.preventDefault();
        
        logger.group('Login Attempt');
        
        // Validate login fields
        let hasErrors = false;
        
        const emailError = validateField('email', $("#loginEmail").val());
        if (emailError) {
            showFieldError('loginEmail', emailError);
            hasErrors = true;
        } else {
            clearFieldError('loginEmail');
        }
        
        if (!$("#loginPassword").val()) {
            showFieldError('loginPassword', 'Password is required');
            hasErrors = true;
        } else {
            clearFieldError('loginPassword');
        }

        if (hasErrors) {
            logger.error('Login Validation Failed');
            logger.end();
            return;
        }

        const loginData = {
            email: $("#loginEmail").val(),
            password: $("#loginPassword").val()
        };

        $.ajax({
            method: "POST",
            url: `${url}api/v1/login`,
            contentType: "application/json",
            data: JSON.stringify(loginData),
            success: function (data) {
                logger.info('Login Success:', data);
                logger.end();
                
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
                
                Swal.fire({
                    icon: "success",
                    text: "Login successful!",
                    showConfirmButton: true
                }).then(() => {
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'home.html';
                    }
                });
            },
            error: function (error) {
                logger.error('Login Failed');
                logger.error('Status:', error.status);
                logger.error('Response:', error.responseText);
                logger.end();

                Swal.fire({
                    icon: "error",
                    text: error.responseJSON?.message || "Login failed",
                    showConfirmButton: true
                });
            }
        });
    });

    $("#profileForm").on('submit', function (event) {
        event.preventDefault();
        
        // Get token for authentication
        const token = sessionStorage.getItem('token');
        if (!token) {
            Swal.fire({
                icon: "error",
                text: "Please login to update your profile",
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }

        // Get user data from session storage
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const userId = user.id;
        
        if (!userId) {
            Swal.fire({
                icon: "error",
                text: "User information not found. Please login again.",
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }

        // Validate required fields
        const name = $('#name').val().trim();
        const email = $('#email').val().trim();

        if (!name || !email) {
            Swal.fire({
                icon: "warning",
                text: "Please fill in all required fields",
                showConfirmButton: true
            });
            return;
        }

        // Create form data
        let formData = new FormData(this);
        formData.append('userId', userId);

        // Show loading state
        $('#updateBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Updating...');

        $.ajax({
            method: "POST",
            url: `${url}api/v1/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            headers: { 
                'Authorization': 'Bearer ' + token 
            },
            success: function (response) {
                console.log('Profile update success:', response);
                
                // Update session storage with new user data
                if (response.user) {
                    sessionStorage.setItem('user', JSON.stringify(response.user));
                }
                
                // Update profile picture preview
                if (response.user && response.user.profile_picture) {
                    $('#avatarPreview').attr('src', `/images/${response.user.profile_picture}`).show();
                }
                
                // Update navigation profile picture
                loadNavProfilePic();
                
                Swal.fire({
                    icon: "success",
                    text: "Profile updated successfully!",
                    showConfirmButton: true
                });
                
                // Reset button state
                $('#updateBtn').prop('disabled', false).html('<i class="fas fa-save"></i> Update Profile');
            },
            error: function (error) {
                console.error('Profile update error:', error);
                
                let errorMessage = "Failed to update profile";
                if (error.responseJSON && error.responseJSON.message) {
                    errorMessage = error.responseJSON.message;
                }
                
                Swal.fire({
                    icon: "error",
                    text: errorMessage,
                    showConfirmButton: true
                });
                
                // Reset button state
                $('#updateBtn').prop('disabled', false).html('<i class="fas fa-save"></i> Update Profile');
            }
        });
    });

     $("#deactivateBtn").on('click', function (e) {
        e.preventDefault();
        let email = $("#email").val()
        let user = {
            email,
        }
        $.ajax({
            method: "DELETE",
            url: `${url}api/v1/deactivate`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 2000,
                    timerProgressBar: true
                });
                sessionStorage.removeItem('userId')
                // window.location.href = 'home.html'
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    // Load user profile data
    function loadUserProfile() {
        const token = sessionStorage.getItem('token');
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        
        if (!token || !user.id) {
            Swal.fire({
                icon: "warning",
                text: "Please login to view your profile",
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }

        // Populate form with current user data
        if (user.name) $('#name').val(user.name);
        if (user.email) $('#email').val(user.email);
        
        // Show profile picture if exists
        if (user.profile_picture) {
            // Handle both old format (with 'images/' prefix) and new format (just filename)
            let imagePath = user.profile_picture;
            if (imagePath.startsWith('images/')) {
                imagePath = imagePath.substring(7); // Remove 'images/' prefix
            }
            $('#avatarPreview').attr('src', `/images/${imagePath}`).show();
        } else {
            // Show default avatar if no profile picture
            $('#avatarPreview').attr('src', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNmZjY5YjQiLz4KPHBhdGggZD0iTTE2IDhDMTguMjA5MSA4IDIwIDkuNzkwODYgMjAgMTJDMjAgMTQuMjA5MSAxOC4yMDkxIDE2IDE2IDE2QzEzLjc5MDkgMTYgMTIgMTQuMjA5MSAxMiAxMkMxMiA5Ljc5MDg2IDEzLjc5MDkgOCAxNiA4WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI0IDI0QzI0IDI2LjIwOTEgMjIuMjA5MSAyOCAyMCAyOEgxMkM5Ljc5MDg2IDI4IDggMjYuMjA5MSA4IDI0VjIyQzggMTkuNzkwOSA5Ljc5MDg2IDE4IDEyIDE4SDIwQzIyLjIwOTEgMTggMjQgMTkuNzkwOSAyNCAyMlYyNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=').show();
        }
    }

    // Load navigation profile picture
    function loadNavProfilePic() {
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        const navProfilePic = document.getElementById('navProfilePic');
        
        if (navProfilePic) {
            if (user.profile_picture) {
                // Handle both old format (with 'images/' prefix) and new format (just filename)
                let imagePath = user.profile_picture;
                if (imagePath.startsWith('images/')) {
                    imagePath = imagePath.substring(7); // Remove 'images/' prefix
                }
                navProfilePic.src = `/images/${imagePath}`;
            } else {
                // Use a data URI for default avatar instead of file
                navProfilePic.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNmZjY5YjQiLz4KPHBhdGggZD0iTTE2IDhDMTguMjA5MSA4IDIwIDkuNzkwODYgMjAgMTJDMjAgMTQuMjA5MSAxOC4yMDkxIDE2IDE2IDE2QzEzLjc5MDkgMTYgMTIgMTQuMjA5MSAxMiAxMkMxMiA5Ljc5MDg2IDEzLjc5MDkgOCAxNiA4WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI0IDI0QzI0IDI2LjIwOTEgMjIuMjA5MSAyOCAyMCAyOEgxMkM5Ljc5MDg2IDI4IDggMjYuMjA5MSA4IDI0VjIyQzggMTkuNzkwOSA5Ljc5MDg2IDE4IDEyIDE4SDIwQzIyLjIwOTEgMTggMjQgMTkuNzkwOSAyNCAyMlYyNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=';
            }
        }
    }

    // Load profile data when page loads
    if (window.location.pathname.includes('profile.html')) {
        loadUserProfile();
    }

    // Load profile picture on all pages
    loadNavProfilePic();
    
    // Refresh profile picture when page loads
    $(document).ready(function() {
        loadNavProfilePic();
    });

    // Logout function
    window.logout = function() {
        const token = sessionStorage.getItem('token');
        if (!token) {
            // If no token, just clear storage and redirect
            sessionStorage.clear();
            window.location.href = 'login.html';
            return;
        }

        $.ajax({
            method: "POST",
            url: `${url}api/v1/logout`,
            headers: { Authorization: "Bearer " + token },
            success: function (data) {
                console.log('Logout successful:', data);
                sessionStorage.clear();
                window.location.href = 'login.html';
            },
            error: function (error) {
                console.log('Logout error:', error);
                // Even if logout fails, clear storage and redirect
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        });
    };
});
