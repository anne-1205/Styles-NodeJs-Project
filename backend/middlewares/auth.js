const jwt = require("jsonwebtoken")
const connection = require('../config/database');

exports.isAuthenticatedUser = (req, res, next) => {

    // console.log(req.headers)
   
    if (!req.header('Authorization')) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    const token = req.header('Authorization').split(' ')[1];
    // console.log(token)

    if (!token) {
        return res.status(401).json({ message: 'Login first to access this resource' })
    }

    const secret = process.env.JWT_SECRET;
    
    try {
        const decoded = jwt.verify(token, secret);
        
        // Check if token exists in database and is not expired, and get user role
        const sql = 'SELECT id, role FROM users WHERE id = ? AND auth_token = ? AND token_expires_at > NOW()';
        connection.execute(sql, [decoded.id, token], (err, results) => {
            if (err) {
                console.log('Token verification error:', err);
                return res.status(500).json({ message: 'Authentication error' });
            }
            
            if (results.length === 0) {
                return res.status(401).json({ message: 'Token is invalid or expired. Please login again.' });
            }
            
            req.user = { 
                id: decoded.id,
                role: results[0].role 
            };
            next();
        });
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

exports.isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Access denied. Admin privileges required.' 
        });
    }
    
    next();
};

