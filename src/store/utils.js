// utils/api.js

/**
 * General-purpose API call function using fetch
 * @param {string} url - The endpoint URL.
 * @param {Object} options - Options for the API call.
 * @param {string} [options.method="GET"] - HTTP method (GET, POST, PUT, DELETE).
 * @param {Object} [options.headers] - Custom headers for the request.
 * @param {Object} [options.params] - Query parameters to append to the URL.
 * @param {Object} [options.body] - Request body, for POST, PUT, etc.
 * @returns {Promise<any>} - Parsed JSON data or error.
 */
export const apiCall = async (url, options = {}) => {
    try {
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        // Handle query parameters
        if (options.params) {
            const queryParams = new URLSearchParams(options.params).toString();
            url = `${url}${url.includes('?') ? '&' : '?'}${queryParams}`;
            delete options.params; // Remove params from options after using them
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        // If there's a body, stringify it
        if (config.body) {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, config);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API call failed');
        }

        return await response.json();
    } catch (error) {
        console.warn('API call failed:', error.message || error);
        throw error;
    }
};
