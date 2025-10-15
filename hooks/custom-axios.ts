import { GlobalLoadingBridge } from "@/components/GlobalLoading";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosRequestConfig } from "axios";
import { serializeToQueryString } from "./forms";

export const AXIOS_INSTANCE = axios.create({
  baseURL: "http://192.168.1.150:9100",
}); // use your own URL here or environment variable
AXIOS_INSTANCE.defaults.xsrfCookieName = undefined;
AXIOS_INSTANCE.defaults.xsrfHeaderName = undefined;

// add a second `options` argument here if you want to pass extra options to each generated query
export const customAxiosInstance = async <T>(
  config: AxiosRequestConfig,
  options?: SecondParameter
): Promise<T> => {
  const htmlEncodedData = config.data;
  // Extract AUTH_TOKEN from localStorage and set Authorization header
  const authToken = await AsyncStorage.getItem("AUTH_TOKEN");
  console.log("BODY DATA:", htmlEncodedData);

  const headers = {
    ...(config.headers || {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  const controller = new AbortController();
  const promise = AXIOS_INSTANCE({
    ...config,
    headers,
    data: htmlEncodedData,
    paramsSerializer: (params) => serializeToQueryString(params),
    ...options,
    signal: controller.signal,
  }).then(({ headers, data }) => ({
    ...data,
    traceId: headers["x-trace-id"],
  }));

  // @ts-ignore
  promise.cancel = () => {
    controller.abort();
  };

  return promise;
};

// ---- Global loading integration ----
let pendingRequests = 0;
const LOADING_HEADER = "x-disable-global-loading";

AXIOS_INSTANCE.interceptors.request.use(
  async (config) => {
    const method = (config.method || "get").toLowerCase();
    const disableGlobal =
      (config.headers as any)?.[LOADING_HEADER] === true ||
      (config.headers as any)?.[LOADING_HEADER] === "true";
    if (method !== "get" && !disableGlobal) {
      pendingRequests += 1;
      if (pendingRequests === 1) {
        GlobalLoadingBridge.api?.show();
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

AXIOS_INSTANCE.interceptors.response.use(
  (response: any) => {
    console.log("Response:", response);
    // hide loader if we showed it
    try {
      const config = response?.config || {};
      const method = (config.method || "get").toLowerCase();
      const disableGlobal =
        (config.headers as any)?.[LOADING_HEADER] === true ||
        (config.headers as any)?.[LOADING_HEADER] === "true";
      if (method !== "get" && !disableGlobal && pendingRequests > 0) {
        pendingRequests -= 1;
        if (pendingRequests === 0) GlobalLoadingBridge.api?.hide();
      }
    } catch {}
    // if (response?.data?.isSuccess && response?.data?.message?.includes('Exception of type')) {
    //   response.data.message = 'Your request was successful.'
    // }
    // if (!response?.data?.isSuccess && response?.data?.message?.includes('Exception of type')) {
    //   response.data.message = 'Unexpected error.'
    // }
    return response;
  },

  (error: any) => {
    // console.error("Error response:", error, error.response);
    // hide loader if we showed it
    try {
      const config = error?.config || {};
      const method = (config.method || "get").toLowerCase();
      const disableGlobal =
        (config.headers as any)?.[LOADING_HEADER] === true ||
        (config.headers as any)?.[LOADING_HEADER] === "true";
      if (method !== "get" && !disableGlobal && pendingRequests > 0) {
        pendingRequests -= 1;
        if (pendingRequests === 0) GlobalLoadingBridge.api?.hide();
      }
    } catch {}
    if (error.status === 401) {
      // goToPage('/Account/Login')
    }
    if (error.status === 400) {
      return Promise.reject(
        new Error(error.response.data.message || "API Error")
      );
    }
    return Promise.reject(new Error(error));
  }
);

// // create a request interceptor to add the CSRF token to the headers
// AXIOS_INSTANCE.interceptors.request.use(
//   async (config) => {
//     if (config.method === 'post') {
//       const baseUrl = document.querySelector('base')?.href ?? '/'
//       const res = await fetch(`${baseUrl}api/CsrfToken/generate`, { method: 'GET' })

//       const response: CsrfTokenResponse = await res.json()

//       if (response?.xsrfToken) {
//         config.headers['X-XSRF-TOKEN'] = response?.xsrfToken
//       }
//     }
//     return config
//   },
//   (error) => {
//     return Promise.reject(new Error(error))
//   }
// )

export type SecondParameter = AxiosRequestConfig;

// export type CsrfTokenResponseAllOf = {
//   xsrfToken?: string
// }

// export type CsrfTokenResponse = BaseEndpointResponseAllOf & CsrfTokenResponseAllOf
