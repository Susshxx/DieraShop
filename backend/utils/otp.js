import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export const generateOtp = () => String(crypto.randomInt(100000, 999999));

export const hashOtp = async (code) => bcrypt.hash(code, 10);

export const compareOtp = async (code, hash) => bcrypt.compare(code, hash);
