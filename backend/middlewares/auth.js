const jwt = require("jsonwebtoken")
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
    const decoded = jwt.verify(token, secret)
    req.user = { id: decoded.id }
    // console.log(req)

    next()
};

