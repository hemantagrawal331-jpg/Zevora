export class UnauthorizedError extends Error {
  constructor() {
    super("You do not have access to sourcing records.");
    this.name = "UnauthorizedError";
  }
}

export class ValidationError extends Error {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}

export class ConfigError extends Error {
  constructor(message = "Sourcing storage is not configured.") {
    super(message);
    this.name = "ConfigError";
  }
}
