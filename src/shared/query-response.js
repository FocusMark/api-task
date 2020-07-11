class QueryResponse {

    constructor(statusCode, data, errors, lastId) {
        let body = {
            data: data,
            errors: errors,
            isSuccessful: errors ? false : true,
        };
        
        if (!body.data) {
            body.data = {};
        }
        if (!body.errors) {
            body.errors = [];
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