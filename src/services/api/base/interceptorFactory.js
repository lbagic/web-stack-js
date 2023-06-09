/**
 * Context types
 *
 * @typedef {{
 *  type: 'grpc' | 'rest'
 *  data: any
 *  headers: Record<string, string>
 *  method: string
 *  name: string
 *  query: string
 *  stream: boolean
 *  url: string
 * }} RequestContext
 * @typedef {{
 *  data: any
 *  headers: Record<string, string>
 * }} ResponseContext
 * @typedef {{
 *  code: number
 *  title: string
 *  message: string
 *  debug: string
 * }} ResponseErrorContext
 */

/**
 * Request and response types
 *
 * @typedef { import("@bufbuild/connect-web").UnaryRequest<import("@bufbuild/protobuf").AnyMessage> } GrpcRequestObject
 * @typedef { import("@bufbuild/connect-web").UnaryResponse<import("@bufbuild/protobuf").AnyMessage> | import("@bufbuild/connect-web").StreamResponse<import("@bufbuild/protobuf").AnyMessage> } GrpcResponseObject
 * @typedef { import("axios").AxiosRequestConfig<any> } RestRequestObject
 * @typedef { import("axios").AxiosRequestConfig<any> } RestResponseObject
 */

/**
 * @typedef { [(value: RestRequestObject) => RestRequestObject, (error: any) => any] } RestRequstInterceptor
 * @typedef { [(value: RestResponseObject) => RestResponseObject, (error: any) => any] } RestResponseInterceptor
 * @typedef {{ request: RestRequstInterceptor, response: RestResponseInterceptor }} RestInterceptor
 * @typedef { import("@bufbuild/connect-web").Interceptor } GrpcInterceptor
 */

/**
 * Create request context for grpc request
 *
 * @param { GrpcRequestObject } request
 * @returns { RequestContext }
 */
const grpcRequestContext = (request) => {
  const serviceName = request.service.typeName.split(".").at(-1);
  const methodName = request.method.name;
  return {
    type: "grpc",
    data: request.message,
    headers: Object.fromEntries(request.header.entries()),
    method: request.init.method,
    name: serviceName + methodName,
    query: "",
    stream: request.stream,
    url: request.url,
  };
};

/**
 * Create response context for grpc response
 *
 * @param { GrpcResponseObject } response
 * @returns { ResponseContext }
 */
const grpcResponseContext = (response) => ({
  data: response.message,
  headers: Object.fromEntries(response.header.entries()),
});

/**
 * Create response error context for grpc response error
 *
 * @param { Error } error
 * @returns { ResponseErrorContext }
 */
const grpcResponseErrorContext = (error) => {
  const [title, message, debug] = error.rawMessage.split("|");
  return {
    code: error.code,
    title,
    message,
    debug,
  };
};

/**
 * Create request context for axios request
 *
 * @param { RestRequestObject } request
 * @returns { RequestContext }
 */
const restRequestContext = (request) => {
  const [name, query] = request.url.split("?");
  const url = request.baseURL + request.url;
  const method = request.method.toUpperCase();
  return {
    type: "rest",
    data: request.data,
    headers: request.headers.common,
    method,
    name: `${method} ${name}`,
    query: `?${query}`,
    stream: false,
    url,
  };
};

/**
 * Create response context for axios response
 *
 * @param { RestResponseObject } response
 * @returns { ResponseContext }
 */
const restResponseContext = (response) => ({
  data: response.data,
  headers: response.headers,
});

/**
 * Create call interceptor
 *
 * @param {{
 *  onRequest: (data: { request: any, requestContext: RequestContext, setHeader: (key: string, value: string) => void }) => RequestContext | undefined
 *  onRequestError: (data: { error: Error, errorContext: any, requestContext: RequestContext }) => void
 *  onResponse: (data: { response: any, requestContext: RequestContext, responseContext: ResponseContext }) => void
 *  onResponseError: (data: { error: Error, errorContext: ResponseErrorContext, requestContext: RequestContext }) => void
 * }} config
 * @returns {{
 *  grpc: GrpcInterceptor
 *  rest: {
 *    request: RestRequstInterceptor,
 *    response: RestResponseInterceptor
 *  }
 * }}
 */
export const createInterceptor = ({
  onRequest,
  onRequestError,
  onResponse,
  onResponseError,
}) => ({
  grpc: (next) => async (request) => {
    const requestContext = grpcRequestContext(request);
    const setHeader = (key, value) => request.header.set(key, value);
    try {
      onRequest?.({ request, requestContext, setHeader });
    } catch (error) {
      const errorContext = {};
      onRequestError?.({ error, errorContext, requestContext });
      throw error;
    }
    try {
      const response = await next(request);
      const responseContext = grpcResponseContext(response);
      onResponse?.({ response, requestContext, responseContext });
      // TODO - handle stream logging
      // if (res.stream)
      //   return {
      //     ...res,
      //     async read() {
      //       const msg = await res.read();
      //       onRequest(res);
      //       onResponse(msg);
      //       return msg;
      //     },
      //   };
      return response;
    } catch (error) {
      const errorContext = grpcResponseErrorContext(error);
      onResponseError?.({ error, errorContext, requestContext });
      throw error;
    }
  },
  rest: {
    request: [
      (request) => {
        const requestContext = restRequestContext(request);
        const setHeader = (key, value) => (request.headers.common[key] = value);
        onRequest?.({ request, requestContext, setHeader });
        return request;
      },
      (error) => {
        const errorContext = {};
        const requestContext = restRequestContext(error.config);
        onRequestError?.({ error, errorContext, requestContext });
        return Promise.reject(error);
      },
    ],
    response: [
      (response) => {
        const request = response.config;
        const responseContext = restResponseContext(response);
        const requestContext = restRequestContext(request);
        onResponse?.({ response, requestContext, responseContext });
        return response;
      },
      (error) => {
        const errorContext = {};
        const requestContext = restRequestContext(error.config);
        onResponseError?.({ error, errorContext, requestContext });
        return Promise.reject(error);
      },
    ],
  },
});
