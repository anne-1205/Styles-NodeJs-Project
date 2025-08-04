$(document).ready(function () {
  let token = sessionStorage.getItem('token');
  if (!token) window.location.href = 'login.html';

  // Fetch dashboard stats
  $.ajax({
    url: 'http://localhost:3000/api/v1/dashboard/stats',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      $('#totalSales').html('₱' + (data.total_sales || 0));
      $('#totalOrders').html(data.total_orders || 0);
      $('#totalCustomers').html(data.total_customers || 0);
      $('#totalProducts').html(data.total_products || 0);
    }
  });

  // Bar Chart: Sales by Month
  $.ajax({
    url: 'http://localhost:3000/api/v1/sales/month',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      const labels = data.sales.map(row => row.month);
      const values = data.sales.map(row => row.total_sales);
      new Chart(document.getElementById('barChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Sales',
            data: values,
            backgroundColor: '#ff69b4'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            },
            y: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            }
          }
        }
      });
    }
  });

  // Line Chart: Sales Trend (last 30 days)
  $.ajax({
    url: 'http://localhost:3000/api/v1/sales/trend',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      const labels = data.sales.map(row => row.day);
      const values = data.sales.map(row => row.total_sales);
      new Chart(document.getElementById('lineChart').getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Sales',
            data: values,
            borderColor: '#ff69b4',
            backgroundColor: 'rgba(255,105,180,0.15)',
            fill: true,
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#ff69b4',
            pointBorderColor: '#fff',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: { color: '#fff' }
            }
          },
          scales: {
            x: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            },
            y: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            }
          }
        }
      });
    }
  });

  // Pie Chart: Sales by Category
  $.ajax({
    url: 'http://localhost:3000/api/v1/sales/category',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      const labels = data.sales.map(row => row.category);
      const values = data.sales.map(row => row.total_sales);
      new Chart(document.getElementById('pieChart').getContext('2d'), {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: ['#ff69b4', '#ffb6c1', '#2c002e', '#ffd6e8', '#18141c']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: { color: '#fff' }
            }
          }
        }
      });
    }
  });

  // Top Selling Products (Horizontal Bar)
  $.ajax({
    url: 'http://localhost:3000/api/v1/sales/top-products',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      const labels = data.products.map(row => row.description);
      const values = data.products.map(row => row.total_quantity);
      new Chart(document.getElementById('topProductsChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Units Sold',
            data: values,
            backgroundColor: '#ff69b4'
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            },
            y: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            }
          }
        }
      });
    }
  });

  // Sales by User (Bar)
  $.ajax({
    url: 'http://localhost:3000/api/v1/sales/by-user',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      const labels = data.users.map(row => row.name);
      const values = data.users.map(row => row.total_spent);
      new Chart(document.getElementById('salesByUserChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Total Spent',
            data: values,
            backgroundColor: '#ffb6c1'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            },
            y: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            }
          }
        }
      });
    }
  });

  // Order Status Distribution (Doughnut)
  $.ajax({
    url: 'http://localhost:3000/api/v1/sales/status',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      const labels = data.status.map(row => row.status);
      const values = data.status.map(row => row.count);
      new Chart(document.getElementById('orderStatusChart').getContext('2d'), {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: ['#ff69b4', '#ffb6c1', '#2c002e', '#ffd6e8', '#18141c']
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: { color: '#fff' }
            }
          }
        }
      });
    }
  });

  // Average Order Value Over Time (Line)
  $.ajax({
    url: 'http://localhost:3000/api/v1/sales/avg-order-value',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      const labels = data.avg.map(row => row.month);
      const values = data.avg.map(row => row.avg_order_value);
      new Chart(document.getElementById('avgOrderValueChart').getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Avg Order Value',
            data: values,
            borderColor: '#ff69b4',
            backgroundColor: 'rgba(255,105,180,0.15)',
            fill: true,
            borderWidth: 3,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#ff69b4',
            pointBorderColor: '#fff',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              labels: { color: '#fff' }
            }
          },
          scales: {
            x: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            },
            y: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            }
          }
        }
      });
    }
  });

  // Recent Orders Table
  $.ajax({
    url: 'http://localhost:3000/api/v1/sales/recent-orders',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      const tbody = $('#recentOrdersTable tbody');
      tbody.html('');
      data.orders.forEach(row => {
        tbody.append(`<tr>
          <td>${row.date_placed ? row.date_placed.split('T')[0] : ''}</td>
          <td>${row.name}</td>
          <td>₱${row.total}</td>
          <td>${row.status}</td>
        </tr>`);
      });
    }
  });

  // Sales Heatmap (Bar by Day of Week)
  $.ajax({
    url: 'http://localhost:3000/api/v1/sales/heatmap',
    method: 'GET',
    headers: { Authorization: 'Bearer ' + token },
    success: function (data) {
      const labels = data.heatmap.map(row => row.day);
      const values = data.heatmap.map(row => row.total_sales);
      new Chart(document.getElementById('salesHeatmapChart').getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Sales',
            data: values,
            backgroundColor: '#2c002e'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            },
            y: {
              ticks: { color: '#fff' },
              grid: { color: '#333' }
            }
          }
        }
      });
    }
  });
});
