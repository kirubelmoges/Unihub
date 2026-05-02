import axios from 'axios';

const BASE_URL = 'http://localhost:8000';
const CSRF_COOKIE_NAME = 'csrftoken';
const CSRF_HEADER_NAME = 'X-CSRFToken';


export const getCsrfToken = () => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${CSRF_COOKIE_NAME}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};


export const fetchCsrfToken = async () => {
  try {
  
    let response = await axios.get(`${BASE_URL}/api/marriage/csrf/`, { 
      withCredentials: true 
    });
    return response.data.csrfToken;
  } catch (error) {
   
    try {
      console.log("Trying exam-ai CSRF endpoint...");
      const response = await axios.get(`${BASE_URL}/api/exam-ai/csrf/`, { 
        withCredentials: true 
      });
      return response.data.csrfToken;
    } catch (err) {
      console.error('CSRF Fetch failed from both endpoints', err);
      return null;
    }
  }
};


export const ensureCsrfToken = async () => {
  let token = getCsrfToken();
  if (!token) {
    console.log("🔐 No CSRF token found, fetching fresh one...");
    token = await fetchCsrfToken();
  }
  return token;
};


const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  xsrfCookieName: CSRF_COOKIE_NAME,
  xsrfHeaderName: CSRF_HEADER_NAME,
});


axiosInstance.interceptors.request.use(
  async (config) => {
   
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
      const token = await ensureCsrfToken();
      if (token) {
        config.headers[CSRF_HEADER_NAME] = token;
        console.log(`🔐 CSRF token added to ${config.method.toUpperCase()} ${config.url}`);
      } else {
        console.warn(`⚠️ No CSRF token for ${config.method.toUpperCase()} ${config.url}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);


axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("🔄 403 error, fetching new CSRF token and retrying...");
      const newToken = await fetchCsrfToken();
      if (newToken) {
        originalRequest.headers[CSRF_HEADER_NAME] = newToken;
        return axiosInstance(originalRequest);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;