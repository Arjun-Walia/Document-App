import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  
  console.log('🔐 Auth middleware:', {
    method: req.method,
    path: req.path,
    hasAuthHeader: !!header,
    hasToken: !!token,
    tokenLength: token ? token.length : 0,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none'
  });

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ error: 'Missing token' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
    req.user = { id: payload.id };
    console.log('✅ Token verified for user:', payload.id);
    next();
  } catch (e) {
    console.log('❌ Token verification failed:', e.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};
