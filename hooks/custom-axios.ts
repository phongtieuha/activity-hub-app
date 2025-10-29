import { GlobalLoadingBridge } from "@/components/GlobalLoading";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { type AxiosRequestConfig } from "axios";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { serializeToQueryString } from "./forms";
import {
  setGlobalNotificationFunction,
  showGlobalNotification,
  useNotification,
} from "./useNotification";

export const AXIOS_INSTANCE = axios.create({
  baseURL: "http://192.168.1.77:9100",
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

// Store router reference for use in interceptors
let globalRouter: any = null;

// Custom hook for axios with router and notification integration
export const useAxiosWithRouter = () => {
  const router = useRouter();
  const { showNotification } = useNotification();

  useEffect(() => {
    // Store router reference for use in interceptors
    globalRouter = router;
    // Set the global notification function from context
    setGlobalNotificationFunction(showNotification);
  }, [router, showNotification]);

  return { router, showNotification };
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
      // Handle unauthorized - redirect to login
      showGlobalNotification("Session expired. Please login again.", "error");

      if (globalRouter) {
        AsyncStorage.removeItem("AUTH_TOKEN");
        globalRouter.replace("/logout");
      } else {
        // Fallback: just remove the token for now
        AsyncStorage.removeItem("AUTH_TOKEN");
      }
    }

    if (error.status === 400) {
      // Show error notification for 400 errors
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Bad request error";

      showGlobalNotification(errorMessage, "error");

      return Promise.reject(
        new Error(
          error.response?.data?.detail ||
            error.response?.data?.message ||
            "API Error"
        )
      );
    }

    // Handle other errors with notifications
    if (error.status >= 500) {
      showGlobalNotification("Server error. Please try again later.", "error");
    } else if (error.status && error.status !== 401 && error.status !== 400) {
      showGlobalNotification("An unexpected error occurred.", "error");
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
