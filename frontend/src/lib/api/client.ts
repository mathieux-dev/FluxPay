import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { HMACConfig, HMACRequestSigner } from './hmac';

export interface APIClientConfig {
  baseURL: string;
  hmacConfig?: HMACConfig;
  onUnauthorized?: () => void;
}

export class APIClient {
  private axiosInstance: AxiosInstance;
  private hmacSigner?: HMACRequestSigner;
  private onUnauthorized?: () => void;

  constructor(private config: APIClientConfig) {
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    if (config.hmacConfig) {
      this.hmacSigner = new HMACRequestSigner(config.hmacConfig);
    }

    this.onUnauthorized = config.onUnauthorized;

    this.axiosInstance.interceptors.request.use(
      async (config) => {
        if (this.hmacSigner && config.method && config.url) {
          const signedRequest = await this.hmacSigner.signRequest(
            config.method.toUpperCase(),
            config.url,
            config.data
          );
          Object.assign(config.headers, signedRequest.headers);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401 && this.onUnauthorized) {
          this.onUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>({ method: 'GET', url: path, params });
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'POST', url: path, data });
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>({ method: 'PUT', url: path, data });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>({ method: 'DELETE', url: path });
  }

  setAccessToken(token: string) {
    this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearAccessToken() {
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.request<T>(config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
    }
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const message = (error.response.data as any)?.message || error.message;
      throw new Error(message);
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    } else {
      throw new Error(error.message);
    }
  }
}
