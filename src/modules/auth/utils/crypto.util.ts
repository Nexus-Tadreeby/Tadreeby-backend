import * as argon2 from 'argon2';

export const hashPassword = (password: string) => argon2.hash(password);

export const verifyPassword = (hash: string, plain: string) => argon2.verify(hash, plain);

export const verifyRefreshToken = (hash: string, token: string) => argon2.verify(hash, token);

export const addDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
