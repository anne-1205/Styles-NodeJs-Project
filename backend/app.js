const express = require('express');
const path = require('path');
const app = express();

// Serve images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

const items = require('./routes/item');
const users = require('./routes/user')
const orders = require('./routes/order')
const dashboard = require('./routes/dashboard');
const sales = require('./routes/sales');
const reviews = require('./routes/review');

app.use(express.json());

// Add a root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the STYLES API',
        status: 'Server is running'
    });
});

app.use('/api/v1', items);
app.use('/api/v1', users);
app.use('/api/v1', orders);
app.use('/api/v1/dashboard', dashboard);
app.use('/api/v1', sales);
app.use('/api/v1', reviews);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app