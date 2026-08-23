import type {
  FastifyError,
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import type { AppError } from "./base-errors.ts";

const SENSITIVE_KEYS = new Set([
  "authorization",
  "password",
  "newpassword",
  "confirmpassword",
  "token",
  "signature",
  "accesstoken",
  "refreshtoken",
]);

function redactBody(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(redactBody);
  }

  if (typeof value !== "object") {
    return value;
  }

  const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      return [key, "[REDACTED]"];
    }

    return [key, redactBody(val)];
  });

  return Object.fromEntries(entries);
}

function sanitizeHeaders(headers: FastifyRequest["headers"]) {
  return {
    ...headers,
    authorization: headers.authorization ? "[REDACTED]" : undefined,
    cookie: headers.cookie ? "[REDACTED]" : undefined,
  };
}

export type ErrorHandlerConfig = {
  serviceName: string;
  enableDetailedErrorLogging?: boolean;
  customHandlers?: {
    [key: string]: (error: FastifyError, reply: FastifyReply) => Promise<void>;
  };
};

export function setupErrorHandler(
  fastify: FastifyInstance,
  config: ErrorHandlerConfig
) {
  fastify.setErrorHandler(
    async (
      error: FastifyError,
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      const { method, url } = request;
      const includeStack = process.env.NODE_ENV !== "production";

      // Log error details
      fastify.log.error(
        {
          error: {
            message: error.message,
            stack: includeStack ? error.stack : undefined,
            statusCode: error.statusCode,
            code: error.code,
          },
          request: {
            method,
            url,
            headers: config.enableDetailedErrorLogging
              ? sanitizeHeaders(request.headers)
              : undefined,
            body: config.enableDetailedErrorLogging
              ? redactBody(request.body)
              : undefined,
          },
          service: config.serviceName,
        },
        "Request error"
      );

      // Check for custom handlers first
      if (
        config.customHandlers &&
        error.code &&
        config.customHandlers[error.code]
      ) {
        await config.customHandlers[error.code](error, reply);
        return;
      }

      // Handle validation errors - show exactly what went wrong
      if (error.code === "FST_ERR_VALIDATION") {
        return reply.status(400).send({
          statusCode: 400,
          error: "Validation Error",
          message: error.message,
        });
      }

      // Handle custom application errors
      if (error.statusCode) {
        const errorTypeMap: Record<string, string> = {
          "BadRequestError": "Bad Request",
          "NotFoundError": "Not Found",
          "ConflictError": "Conflict",
          "ForbiddenError": "Forbidden",
          "ValidationError": "Bad Request",
        };

        const errorType = errorTypeMap[error.name] || error.name || "Application Error";

        return reply.status(error.statusCode).send({
          statusCode: error.statusCode,
          error: errorType,
          message: error.message,
          code: (error as AppError).code,
        });
      }

      // Handle timeout errors (ex: API IXC ou Cloudflare fora)
      if (error.code === "ETIMEDOUT" || error.code === "ECONNRESET") {
        return reply.status(504).send({
          statusCode: 504,
          error: "Gateway Timeout",
          message: "Service temporarily unavailable",
          code: "SERVICE_TIMEOUT",
        });
      }

      // Handle URL validation errors
      if (error.code === "ERR_INVALID_URL") {
        return reply.status(400).send({
          statusCode: 400,
          error: "Invalid URL",
          message: "The provided URL is not valid",
          code: "INVALID_URL",
        });
      }

      // Default 500 error
      return reply.status(500).send({
        statusCode: 500,
        error: "Internal Server Error",
        message: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
      });
    }
  );

  // Handle 404 errors
  fastify.setNotFoundHandler(
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.status(404).send({
        statusCode: 404,
        error: "Not Found",
        message: `Route ${request.method} ${request.url} not found`,
        code: "ROUTE_NOT_FOUND",
      });
    }
  );
}
