import jwt from 'jsonwebtoken';

export const signToken = (user) =>
  jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

export const verifyTokenString = (token) => jwt.verify(token, process.env.JWT_SECRET);
