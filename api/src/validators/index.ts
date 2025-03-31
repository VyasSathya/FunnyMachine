import { body, param, query } from 'express-validator';

// User validation schemas
export const registerSchema = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
];

export const loginSchema = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Joke validation schemas
export const createJokeSchema = [
  body('text')
    .notEmpty()
    .withMessage('Joke text is required')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Joke text must be less than 1000 characters'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

export const updateJokeSchema = [
  param('id')
    .isUUID()
    .withMessage('Invalid joke ID'),
  body('text')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Joke text must be less than 1000 characters'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// Bit validation schemas
export const createBitSchema = [
  body('label')
    .notEmpty()
    .withMessage('Bit label is required')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Bit label must be less than 255 characters'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

export const updateBitSchema = [
  param('id')
    .isUUID()
    .withMessage('Invalid bit ID'),
  body('label')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Bit label must be less than 255 characters'),
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

// Bit-Joke relationship validation schemas
export const addJokeToBitSchema = [
  param('bitId')
    .isUUID()
    .withMessage('Invalid bit ID'),
  param('jokeId')
    .isUUID()
    .withMessage('Invalid joke ID'),
  body('orderIndex')
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer')
]; 