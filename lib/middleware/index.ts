export {
  withErrorHandler,
  withAuth,
  withValidation,
  withRateLimit,
  apiHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError
} from './api-error-handler';

export type {
  ApiError,
  ApiResponse,
  RequestContext
} from './api-error-handler';