import { Types } from 'mongoose';

export function isValidObjectId(id: string | undefined | null): boolean {
  return !!id && Types.ObjectId.isValid(id);
}

export class HttpError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}
