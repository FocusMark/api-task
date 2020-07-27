let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { FMErrors, AWSErrors } = require('../shared/errors');
const Response = require('../shared/response');
const Configuration = require('../shared/configuration');
const Task = require('../shared/task');
const JwtUser = require('../shared/jwt-user');

let configuration = new Configuration();
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();

exports.postHandler = async (event, context) => {
    try {
        let user = new JwtUser(event);
        let task = createTask(user, event);
        
        await saveTask(user, task);
        
        let responseViewModel = { taskId: task.taskId };
        return new Response(201, responseViewModel, null, task.taskId);
    } catch(err) {
        console.info(err);
        console.info('Aborting Lambda execution');
        return handleError(err);
    }
};

function createTask(user, event) {
    console.info('Creating Task from request');
    let viewModel;
    try {
        viewModel = JSON.parse(event.body);
    } catch(err) {
        throw FMErrors.JSON_MALFORMED;
    }
    
    if (viewModel.taskId || viewModel.userId || viewModel.createdAt || viewModel.updatedAt) {
        throw FMErrors.JSON_INVALID_FIELDS;
    }
    
    let task = new Task(user, viewModel);
    
    console.info('Validating Task');
    task.validate();
    
    console.info('Validation completed successfully.');
    return task;
}

async function saveTask(user, task) {
    console.info(`Persisting Task ${task.taskId} to the data store.`);
    let newRecord = task;
    newRecord.updatedAt = Date.now();
    newRecord.createdAt = Date.now();
    newRecord.clientsUsed = [ user.clientId ];
    
    let postParameters = {
        TableName: configuration.data.dynamodb_taskTable,
        Item: newRecord,
    };
    
    console.info('Writing to table');
    try {
        await dynamoDbClient.put(postParameters).promise();
    } catch(err) {
        console.info(err);
        throw new AWSErrors.DYNAMO_NEW_PUT_FAILED;
    }
    console.info('Write complete');
}

function handleError(err) {
    switch(err.code) {
        case FMErrors.MISSING_AUTHORIZATION.code:
            return new Response(401, null, err);
        case FMErrors.JSON_MALFORMED.code:
        case FMErrors.JSON_INVALID_FIELDS.code:
        case FMErrors.JSON_MISSING_FIELDS.code:
        case FMErrors.PROJECT_TITLE_VALIDATION_FAILED.code:
        case FMErrors.PROJECT_STATUS_VALIDATION_FAILED.code:
        case FMErrors.PROJECT_KIND_VALIDATION_FAILED.code:
            return new Response(422, null, err);
        case AWSErrors.DYNAMO_NEW_PUT_FAILED.code:
            return new Response(500, null, err);
    }
    
    return new Response(500, { code: 500, message: 'Server failed to process your request.' });
}