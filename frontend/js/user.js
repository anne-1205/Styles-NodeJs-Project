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

        // Validate form
        if (!$("#name").val() || !$("#email").val() || !$("#password").val()) {
            logger.error('Validation Failed: Missing required fields');
            logger.end();
            
            Swal.fire({
                icon: "error",
                text: "Please fill all required fields",
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

    $('#avatar').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                console.log(e.target.result)
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    $("#loginForm").on('submit', function (e) {
        e.preventDefault();

        let email = $("#email").val();
        let password = $("#password").val();
        let user = { email, password };

        $.ajax({
            method: "POST",
            url: `http://localhost:3000/api/v1/login`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log('Login response:', data.user); // Add this line
                sessionStorage.setItem('token', data.token);
                sessionStorage.setItem('user', JSON.stringify(data.user));
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'home.html';
                }
            },
            error: function (error) {
                const msg = error.responseJSON?.message || "Login failed";
                if (msg.includes('inactive')) {
                    Swal.fire({
                        icon: "warning",
                        title: "Account Inactive",
                        text: "Your account has been deactivated or is inactive. Please contact support or your administrator.",
                        showConfirmButton: true
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        text: msg,
                        showConfirmButton: true
                    });
                }
            }
        });
    });

    $("#updateBtn").on('click', function (event) {
        event.preventDefault();
        userId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId')
       
        var data = $('#profileForm')[0];
       
        let formData = new FormData(data);
        formData.append('userId', userId)

        $.ajax({
            method: "POST",
            url: `${url}api/v1/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (data) {
                console.log(data);
            },
            error: function (error) {
                console.log(error);
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
});
