const app = require('./app');

require('dotenv').config()

app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(PORT)
  console.log(`Server is running on port ${PORT}`);
});