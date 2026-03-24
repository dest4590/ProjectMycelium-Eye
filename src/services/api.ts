import axios from 'axios';

export const api = axios.create({ baseURL: 'http://localhost:8080' });
export const apiV1 = axios.create({ baseURL: 'http://localhost:8080/api' });
