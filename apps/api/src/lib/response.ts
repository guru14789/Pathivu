import { Response } from 'express';

export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: any;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    errorId?: string;
  };
}

export const sendSuccess = <T>(res: Response, data: T, meta?: any, status = 200) => {
  const response: SuccessResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(status).json(response);
};

export const sendError = (res: Response, error: { code: string; message: string; details?: any; status?: number }, requestId?: string) => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      errorId: requestId,
    },
  };
  return res.status(error.status || 500).json(response);
};
