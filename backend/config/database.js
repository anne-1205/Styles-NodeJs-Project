const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',  // replace with your MySQL username
    password: '',  // replace with your MySQL password
    database: 'styles'  // replace with your database name
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Successfully connected to MySQL database');
});

module.exports = connection;

