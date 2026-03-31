/**
 * Zod Validation Middleware
 * 
 * Express middleware for validating request body, query, and params using Zod schemas.
 * 
 * @module shared/middleware/validate
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AnyZodObject, ZodError, ZodSchema, z } from 'zod';

/**
 * Validation error response format
 */
interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validation error response
 */
interface ValidationErrorResponse {
  success: false;
  error: 'Validation failed';
  details: ValidationErrorDetail[];
}

/**
 * Format Zod errors into a user-friendly format
 */
function formatZodErrors(error: ZodError): ValidationErrorDetail[] {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));
}

/**
 * Create validation middleware for a specific target (body, query, params)
 */
function createValidationMiddleware(
  schema: ZodSchema,
  target: 'body' | 'query' | 'params'
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const parsed = await schema.parseAsync(data);
      
      // Replace the target with parsed (and potentially transformed) data
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const response: ValidationErrorResponse = {
          success: false,
          error: 'Validation failed',
          details: formatZodErrors(error),
        };
        return res.status(400).json(response);
      }
      next(error);
    }
  };
}

/**
 * Validate request body
 * 
 * @example
 * router.post('/users', validateBody(userSchema), createUser);
 */
export function validateBody<T extends ZodSchema>(schema: T): RequestHandler {
  return createValidationMiddleware(schema, 'body');
}

/**
 * Validate query parameters
 * 
 * @example
 * router.get('/users', validateQuery(listUsersQuerySchema), listUsers);
 */
export function validateQuery<T extends ZodSchema>(schema: T): RequestHandler {
  return createValidationMiddleware(schema, 'query');
}

/**
 * Validate route parameters
 * 
 * @example
 * router.get('/users/:id', validateParams(userIdParamSchema), getUser);
 */
export function validateParams<T extends ZodSchema>(schema: T): RequestHandler {
  return createValidationMiddleware(schema, 'params');
}

/**
 * Validate multiple parts of the request
 * 
 * @example
 * router.put('/users/:id', validate({
 *   params: userIdParamSchema,
 *   body: updateUserSchema,
 * }), updateUser);
 */
export function validate(schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate each specified part
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const response: ValidationErrorResponse = {
          success: false,
          error: 'Validation failed',
          details: formatZodErrors(error),
        };
        return res.status(400).json(response);
      }
      next(error);
    }
  };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  /**
   * UUID validation
   */
  uuid: z.string().uuid('Invalid UUID format'),
  
  /**
   * MongoDB ObjectId validation (if needed)
   */
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  
  /**
   * Email validation
   */
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  
  /**
   * Phone number validation (international format)
   */
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  
  /**
   * Pagination query schema
   */
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort_by: z.string().optional(),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
  }),
  
  /**
   * ID parameter schema
   */
  idParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
  
  /**
   * Date range query schema
   */
  dateRange: z.object({
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
  }),
};

/**
 * Create a schema that allows partial updates
 */
export function partial<T extends ZodSchema>(schema: T): ZodSchema {
  return schema.partial();
}

/**
 * Create a schema that requires at least one field
 */
export function atLeastOne<T extends ZodSchema>(schema: T): ZodSchema {
  return schema.refine(
    (data) => Object.keys(data as object).length > 0,
    { message: 'At least one field must be provided' }
  );
}

export default {
  validateBody,
  validateQuery,
  validateParams,
  validate,
  commonSchemas,
  partial,
  atLeastOne,
};
