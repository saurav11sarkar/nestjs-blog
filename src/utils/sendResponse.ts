type ApiResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
  data?: T;
};

const sendResponse = <T>(jsondata: ApiResponse<T>) => {
  return {
    statusCode: jsondata.statusCode,
    success: jsondata.success,
    message: jsondata.message,
    meta: jsondata.meta,
    data: jsondata.data,
  };
};

export default sendResponse;
