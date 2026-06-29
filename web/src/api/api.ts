import type { AxiosRequestConfig } from 'axios'
import axiosInstance from './axiosInstance'

// Generic GET
export const apiGet = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  axiosInstance.get<T>(url, config).then((res) => res.data)

// Generic POST
export const apiPost = <T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> => axiosInstance.post<T>(url, data, config).then((res) => res.data)

// Generic PUT
export const apiPut = <T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> => axiosInstance.put<T>(url, data, config).then((res) => res.data)

// Generic PATCH
export const apiPatch = <T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig,
): Promise<T> => axiosInstance.patch<T>(url, data, config).then((res) => res.data)

// Generic DELETE
export const apiDelete = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  axiosInstance.delete<T>(url, config).then((res) => res.data)
