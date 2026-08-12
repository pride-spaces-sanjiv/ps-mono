export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  statusCode: number;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  pagination: PaginatedMeta;
}
