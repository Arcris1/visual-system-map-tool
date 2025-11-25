import axios from 'axios';
import { API_CONSTANTS } from '@/constants/apiConstants'; 
// import eventBus from '@/utils/eventBus';

let csrfInitialized = false;
// Create an instance of axios with a default configuration
const apiClient = axios.create({
    baseURL: API_CONSTANTS.BASE_URL, // Set the base URL from constants
    timeout: API_CONSTANTS.TIMEOUT || 10000,  // Set timeout duration,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    // withCredentials: true, 
    // withXSRFToken: true,
});

// Add a request interceptor
apiClient.interceptors.request.use(
    (config) => {
        // Optionally add request headers, modify data, etc.
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        // Handle request errors
        return Promise.reject(error);
    }
)

apiClient.interceptors.response.use(
    (response) => {
        return response;
    }, 
    (error) => {
        // Handle specific status codes, log errors, etc.
        if (error.response) {
            const { status, data } = error.response;

            switch (status) {
                case 401: // Unauthorized
                    console.error('Unauthorized access:', data.message || 'Please log in.');
                    // Clear the token and redirect to login page
                    // localStorage.removeItem('token');
                    localStorage.removeItem('isAuthenticated');
                    // Redirect to login page
                    window.location.href = '/login';
                    // eventBus.emit('sessionExpired', { message: 'Your session has expired. Please log in again.' });
                    break;
                case 403: // Forbidden
                    console.error('Access forbidden:', data.message || 'You do not have permission.');
                    break;
                case 404: // Not Found
                    console.error('Not found:', data.message || 'The resource does not exist.');
                    break;
                case 419:
                    console.error('Page Expired:', data.message || 'The page has expired.');
                    csrfInitialized = false;

                    // eventBus.emit('sessionExpired', { message: 'Your session has expired. Please log in again.' });
                    break;
                case 422: // Validation errors
                    console.error('Validation error:', data.errors || data.message);
                    break;
                case 500: // Internal Server Error
                    console.error('Server error:', data.message || 'Something went wrong.');
                    break;
                default:
                    console.error('Unhandled error:', data.message || 'An error occurred.');
            }

        } else {
            console.error("Network Error:", error.message | 'Unable to connect to the server');
        }

        return Promise.reject(error);
    }
)

/**
 * Initializes the CSRF token if it has not been initialized yet.
 * This function sends a GET request to the CSRF endpoint to retrieve the CSRF token.
 * If the request is successful, it sets the csrfInitialized flag to true.
 * If the request fails, it logs the error to the console and rethrows the error.
 *
 * @throws {Error} Throws an error if the CSRF token initialization fails.
 */
const initializeCSRFToken = async () => {
    if (!csrfInitialized) {
        try {
            const response = await apiClient.get(API_CONSTANTS.CSRF || '/sanctum/csrf-cookie');
            if (response.status === 204) {
                csrfInitialized = true;
            }
        } catch (error) {
            console.error('Failed to initialize CSRF token:', error);
            throw error;
        }
    }
};

/**
 * Fetches data from the specified endpoint after initializing the CSRF token.
 *
 * @param {string} endpoint - The API endpoint to fetch data from.
 * @returns {Promise<Object>} The response from the API.
 * @throws {Error} If the request fails.
 */
export const getData = async (endpoint, params) => {
    // await initializeCSRFToken();
    try {
        const response = await apiClient.get(endpoint, {
            params: params
        });
        return response;
    } catch (error) {
        throw error;
    }
};

export const getStreamData = async (endpoint, params) => {
    try {
        const response = await apiClient.get(endpoint, {
            ...params // ensure responseType: 'blob' is passed
        });
        return response.data; // return only the Blob
    } catch (error) {
        throw error;
    }
};
/**
 * Sends a POST request to the specified endpoint with the provided data.
 * 
 * @param {string} endpoint - The API endpoint to send the POST request to.
 * @param {Object} [data={}] - The data to be sent in the POST request.
 * @returns {Promise<Object>} - The response from the API.
 * @throws {Error} - Throws an error if the request fails.
 */
export const postData = async (endpoint, data = {}) => {
    // await initializeCSRFToken();
    try {
        const response = await apiClient.post(endpoint, data);
        return response;
    } catch (error) {
        throw error;
    }
};

export const putData = async (endpoint, data = {}) => {
    // await initializeCSRFToken();
    try {
        const response = await apiClient.put(endpoint, data);
        return response;
    } catch (error) {
        throw error;
    }
};

export const patchData = async (endpoint, data = {}) => {
    // await initializeCSRFToken();
    try {
        const response = await apiClient.patch(endpoint, data);
        return response;
    } catch (error) {
        throw error;
    }
};

export const putFileData = async (endpoint, formData) => {
    try {
        const response = await apiClient.put(endpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response;
    } catch (error) {
        console.error('File upload failed:', error);
        throw error;
    }
}

export const postFileData = async (endpoint, formData) => {
    try {
        const response = await apiClient.post(endpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response;
    } catch (error) {
        console.error('File upload failed:', error);
        throw error;
    }
}

/**
 * Deletes data from the specified endpoint.
 *
 * @param {string} endpoint - The API endpoint to send the delete request to.
 * @param {Object} [data={}] - The data to be sent with the delete request.
 * @returns {Promise<Object>} The response from the API.
 * @throws Will throw an error if the delete request fails.
 */
export const deleteData = async (endpoint, data = {}) => {
    try {
        const response = await apiClient.delete(endpoint, { data });
        return response;
    } catch (error) {
        throw error;
    }
}


/**
 * Downloads a file from the specified endpoint and triggers a browser download.
 *
 * @param {string} endpoint - The API endpoint to download the file from.
 * @param {string} [filename] - Optional filename for the downloaded file.
 * @returns {Promise<void>} Resolves when the download is triggered.
 * @throws {Error} If the request fails.
 */
export const downloadFile = async (endpoint, filename) => {
    try {
        const response = await apiClient.get(endpoint, {
            responseType: 'blob'
        });

        // Try to get filename from response headers if not provided
        let downloadFilename = filename;
        const disposition = response.headers['content-disposition'];
        if (!downloadFilename && disposition && disposition.includes('filename=')) {
            downloadFilename = disposition.split('filename=')[1].replace(/"/g, '').trim();
        }

        const blob = new Blob([response.data]);
        const downloadUrl = window.URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = downloadFilename || 'downloaded-file';
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Failed to download file:', error);
        throw error;
    }
};

// Export apiClient for direct axios usage
export default apiClient;