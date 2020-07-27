const FMErrors = {
    MISSING_AUTHORIZATION: {
        code: 4011,
        message: 'Not authorized'
    },
    INVALID_ROUTE: {
        code: 4041,
        message: 'Invalid API route requested.'
    },
    JSON_MALFORMED: {
        code: 4221,
        message: 'Json given is malformed.'
    },
    JSON_INVALID_FIELDS: {
        code: 4222,
        message: 'Invalid field(s) found in the JSON for this request.'
    },
    JSON_MISSING_FIELDS: {
        code: 4223,
        message: 'Missing field(s) in the JSON for this request.'
    },
    TITLE_VALIDATION_FAILED: {
        code: 4224,
        message: 'Title is invalid. Must be at least 3 characters in length and no more than 100'
    },
    STATUS_VALIDATION_FAILED: {
        code: 4225,
        message: 'Status is invalid. Must use one of the supported values.'
    },
    PROJECT_ID_VALIDATION_FAILED: {
        code: 4226,
        message: 'Task was not assigned to a valid Project'
    },
    MALFORMED_PROJECT_EVENT: {
        code: 4227,
        message: 'Task services received a malformed Json payload from SNS for a Project event'
    }
};

const AWSErrors = {
    DYNAMO_NEW_PUT_FAILED: {
        code: 1001,
        message: 'Failed to create the record'
    },
    DYNAMO_UPDATE_PUT_FAILED: {
        code: 1002,
        message: 'Failed to update the record'
    },
    DYNAMO_GET_ALL_FAILED: {
        code: 1003,
        message: 'Failed to retrieve tasks',
    },
    DYNAMO_GET_ITEM_FAILED: {
        code: 4041,
        message: 'Not found'
    },
}

module.exports = { FMErrors, AWSErrors };