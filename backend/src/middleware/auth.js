const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // ignoreExpiration: true handles old tokens that were issued with expiry
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    req.rep = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
};

module.exports = { authenticate };
