class QueryResponse {

    constructor(statusCode, data, errors, lastId) {
        let body = {
            data: data,
            error: errors,
            isSuccessful: errors ? false : true,
        };
        
        if (!body.data) {
            body.data = {};
        }
        if (!body.error) {
            body.error = {}
        }
        
        body.pagination = {};
        if (lastId) {
            body.pagination.lastId = lastId;
            body.pagination.additionalDataAvailable = true;
        } else {
            body.pagination.additionalDataAvailable = false;
            body.pagination.lastId = "None";
        }
        
        if (Array.isArray(data)) {
            body.pagination.pageSize = data.length;
        }  else if (Object.keys(body.data).length === 0) {
            // if the body.data object is empty then we have nothing to return.
            body.pagination.pageSize = 0;
        } else {
            body.pagination.pageSize = 1;
        }
        
        this.body = JSON.stringify(body);
        
        this.statusCode = statusCode;
        this.headers = {
            'Content-Type': 'application/json',
        };
    }
}

module.exports = QueryResponse;