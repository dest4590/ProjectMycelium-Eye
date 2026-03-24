import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useToast } from '@/composables/useToast';

const { showToast } = useToast();

class ApiService {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL:
                (import.meta as any).env?.VITE_API_URL ||
                'http://localhost:8080/api',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                const message =
                    error.response?.data?.message ||
                    (error.response?.data &&
                    typeof error.response.data === 'string'
                        ? error.response.data
                        : error.message) ||
                    'An unexpected error occurred';
                showToast(message, 'error');
                return Promise.reject(error);
            },
        );
    }

    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    public async post<T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    public async delete<T>(
        url: string,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }

    public async put<T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    public async patch<T>(
        url: string,
        data?: any,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }

    public async setUserScanned(username: string, scanned: boolean) {
        return this.patch(`/user/${username}/scanned?scanned=${scanned}`);
    }

    public async setUserHidden(username: string, hidden: boolean) {
        return this.patch(`/user/${username}/hidden?hidden=${hidden}`);
    }
}

export const apiService = new ApiService();
