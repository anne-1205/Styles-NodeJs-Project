$(document).ready(function() {
    function fetchUsers() {
      $.ajax({
        url: 'http://localhost:3000/api/v1/users',
        method: 'GET',
        success: function(data) {
          const users = data.rows || data;
          const tbody = $('#userTable tbody');
          tbody.html('');
          users.forEach(user => {
            tbody.append(`
              <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.status}</td>
                <td>
                  <button class="roleBtn" data-id="${user.id}" data-role="${user.role}">Change Role</button>
                  <button class="statusBtn" data-id="${user.id}" data-status="${user.status}">Change Status</button>
                </td>
              </tr>
            `);
          });
        }
      });
    }
  
    fetchUsers();
  
    let modalCallback = null;
    let modalValue = null;

    function showModal(title, currentValue, callback, type) {
      $('#modalTitle').text(title);
      let togglesHtml = '';
      if (type === 'role') {
        togglesHtml = `
          <button class="toggle-btn" data-value="admin">Admin</button>
          <button class="toggle-btn" data-value="user">User</button>
        `;
      } else if (type === 'status') {
        togglesHtml = `
          <button class="toggle-btn" data-value="active">Active</button>
          <button class="toggle-btn" data-value="inactive">Inactive</button>
        `;
      }
      $('#modalToggles').html(togglesHtml);
      // Set selected
      $('#modalToggles .toggle-btn').each(function() {
        if ($(this).data('value') === currentValue) {
          $(this).addClass('selected');
          modalValue = currentValue;
        }
      });
      // Toggle selection
      $('#modalToggles .toggle-btn').off('click').on('click', function() {
        $('#modalToggles .toggle-btn').removeClass('selected');
        $(this).addClass('selected');
        modalValue = $(this).data('value');
      });
      $('#customModal').fadeIn(120);
      modalCallback = callback;
    }

    $('#modalOk').off('click').on('click', function() {
      $('#customModal').fadeOut(120);
      if (modalCallback) modalCallback(modalValue);
    });
    $('#modalCancel').off('click').on('click', function() {
      $('#customModal').fadeOut(120);
    });

    $(document).on('click', '.roleBtn', function() {
      const id = $(this).data('id');
      const currentRole = $(this).data('role');
      showModal('Change User Role:', currentRole, function(newRole) {
        if (newRole && (newRole === 'admin' || newRole === 'user')) {
          $.ajax({
            url: `http://localhost:3000/api/v1/users/${id}/role`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ role: newRole }),
            success: function() {
              alert('Role updated successfully!');
              fetchUsers();
            },
            error: function() {
              alert('Failed to update role.');
            }
          });
        }
      }, 'role');
    });

    $(document).on('click', '.statusBtn', function() {
      const id = $(this).data('id');
      const currentStatus = $(this).data('status');
      showModal('Change User Status:', currentStatus, function(newStatus) {
        if (newStatus && (newStatus === 'active' || newStatus === 'inactive')) {
          $.ajax({
            url: `http://localhost:3000/api/v1/users/${id}/status`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify({ status: newStatus }),
            success: function() {
              alert('Status updated successfully!');
              fetchUsers();
            },
            error: function() {
              alert('Failed to update status.');
            }
          });
        }
      }, 'status');
    });
  });
  