import type { ZodError, ZodIssue } from "zod";

export type SanitizedValidationError = {
  field: string;
  message: string;
  code: string;
};

/**
 * Mapeamento de campos para nomes mais amigáveis ao usuário
 */
const FIELD_NAME_MAPPINGS: Record<string, string> = {
  name: "nome",
  email: "email",
  cpfCnpj: "CPF/CNPJ",
  password: "senha",
  phone: "telefone",
  mensagem: "mensagem",
  clienteId: "ID do cliente",
  sessionId: "sessão",
} as const;

/**
 * Sensitive patterns that should never be exposed in error messages
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /senha/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /bearer/i,
] as const;

/**
 * Maps Zod error codes to user-friendly messages
 */
const ERROR_CODE_MESSAGES: Record<string, string> = {
  invalid_type: "Tipo de dado inválido",
  invalid_literal: "Valor inválido",
  custom: "Valor inválido",
  invalid_union: "Valor inválido",
  invalid_union_discriminator: "Valor inválido",
  invalid_enum_value: "Valor deve ser uma das opções válidas",
  unrecognized_keys: "Campos não reconhecidos",
  invalid_arguments: "Argumentos inválidos",
  invalid_return_type: "Tipo de retorno inválido",
  invalid_date: "Data inválida",
  invalid_string: "Texto inválido",
  too_small: "Valor muito pequeno",
  too_big: "Valor muito grande",
  invalid_intersection_types: "Tipos incompatíveis",
  not_multiple_of: "Deve ser múltiplo de",
  not_finite: "Deve ser um número finito",
} as const;

/**
 * Creates a safe field name for error messages
 */
function getSafeFieldName(path: (string | number)[]): string {
  if (path.length === 0) {
    return "campo";
  }

  const fieldName = String(path[0]);
  return FIELD_NAME_MAPPINGS[fieldName] || "campo";
}

/**
 * Creates a safe error message that doesn't expose sensitive information
 */
function createSafeMessage(issue: ZodIssue, fieldName: string): string {
  // Check if the original message contains sensitive information
  const hasSensitiveData = SENSITIVE_PATTERNS.some(
    (pattern) => pattern.test(issue.message) || pattern.test(fieldName)
  );

  if (hasSensitiveData) {
    return "Valor inválido fornecido";
  }

  // Use custom message if available and safe
  if (issue.message && issue.message !== issue.code) {
    // Remove any potential data values from the message
    const cleanMessage = issue.message
      .replace(/["'][^"']*["']/g, '"***"') // Remove quoted values
      .replace(/\b\d{3,}\b/g, "***") // Remove long numbers (like CPF/CNPJ)
      .replace(
        /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
        "***@***.***"
      ); // Remove emails

    return cleanMessage;
  }

  // Use mapped error code message
  const mappedMessage = ERROR_CODE_MESSAGES[issue.code];
  if (mappedMessage) {
    return mappedMessage;
  }

  // Fallback to generic message
  return `${fieldName} inválido`;
}

/**
 * Sanitizes Zod validation errors to prevent sensitive data exposure
 */
export function sanitizeValidationErrors(
  zodError: ZodError
): SanitizedValidationError[] {
  return zodError.issues.map((issue) => {
    // Corrige o tipo do path para garantir que só string ou number sejam usados
    const safePath = issue.path.filter(
      (p): p is string | number =>
        typeof p === "string" || typeof p === "number"
    );
    const fieldName = getSafeFieldName(safePath);
    const safeMessage = createSafeMessage(issue, fieldName);

    return {
      field: safePath.length > 0 ? String(safePath[0]) : "unknown",
      message: safeMessage,
      code: issue.code,
    };
  });
}

/**
 * Creates a sanitized validation error response
 */
export function createValidationErrorResponse(zodError: ZodError) {
  const sanitizedErrors = sanitizeValidationErrors(zodError);

  return {
    error: "Validation Error",
    message: "Dados da requisição inválidos",
    details: sanitizedErrors,
  };
}
