class Response {
    /**
     * 
     * @constructor
     * @param {number} - The HTTP status code that this Response needs to represent.
     * @param {data} - The data that will represent a HTTP response body.
     * @param {errors} - Any errors that need to be returned as part of the HTTP response body.
     * @param {createdLocation} - A location header value.
     * 
     */
    constructor(statusCode, data, error, createdLocation) {
        let body = {
            data: data,
            error: error,
            isSuccessful: error ? false : true,
        };
        
        if (!body.data) {
            body.data = {};
        }
        if (!body.error) {
            body.error = {};
        }
        
        this.body = JSON.stringify(body);
        
        this.statusCode = statusCode;
        this.headers = {
            'Content-Type': 'application/json',
        };
        
        if (statusCode == 202) {
            this.headers['Location'] = createdLocation;
        }
    }
}

module.exports = Response;