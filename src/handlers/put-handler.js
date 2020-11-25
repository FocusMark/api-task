let AWS = require('aws-sdk');
// let AWSXRay = require('aws-xray-sdk');
// let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { FMErrors, AWSErrors } = require('../shared/errors');
const Response = require('../shared/response');
const Configuration = require('../shared/configuration');
const Task = require('../shared/task');
const JwtUser = require('../shared/jwt-user');

let configuration = new Configuration();
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();

exports.putHandler = async (event, context) => {
    try {
        let user = new JwtUser(event);
        let newTask = createTask(user, event);
        
        let existingTask = await getTask(newTask);
        if (!existingTask) {
            return new Response(404, null, 'not found');
        }
        
        await saveTask(user, newTask, existingTask);
        
        let responseViewModel = { taskId: newTask.taskId };
        return new Response(201, responseViewModel, null, newTask.taskId);
    } catch(err) {
        console.info(err);
        console.info('Aborting Lambda execution');
        return handleError(err);
    }
};

function createTask(user, event) {
    console.info('Creating Task from request');
    let body;
    try {
        body = JSON.parse(event.body);
    } catch(err) {
        throw FMErrors.JSON_MALFORMED;
    }
    
    let viewModel = new Task(user, body);
    if (!event.pathParameters || !event.pathParameters.taskId) {
        throw FMErrors.INVALID_ROUTE;
    }
    
    viewModel.taskId = event.pathParameters.taskId;
    
    if (!viewModel.taskId || !viewModel.userId) {
        throw FMErrors.JSON_INVALID_FIELDS;
    }
    
    console.info('Validating Task');
    viewModel.validate();
    
    console.info('Validation completed successfully.');
    return viewModel;
}

async function getTask(task) {
    let params = {
        TableName: configuration.data.dynamodb_taskTable,
        Key: { userId: task.userId, taskId: task.taskId },
    };
    
    console.info(params);
    
    try {
        let fetchedTask = await dynamoDbClient.get(params).promise();
        if (Object.keys(fetchedTask).length === 0 || Object.keys(fetchedTask.Item).length == 0) {
            console.info('Task does not exist and can not be updated');
            return null;
        } else {
            console.info('Verified task exists.');
            console.info(fetchedTask);
            return fetchedTask.Item;
        }
    } catch(err) {
        console.info(err);
        throw AWSErrors.DYNAMO_GET_ITEM_FAILED;
    }
}

async function saveTask(user, newTask, oldTask) {
    console.info(`Persisting Task ${oldTask.taskId} to the data store.`);
    let updatedRecord = newTask;
    updatedRecord.updatedAt = Date.now();
    updatedRecord.createdAt = Date.now();
    updatedRecord.clientsUsed = oldTask.clientsUsed;
    
    if (!oldTask.clientsUsed.includes(user.clientId)) {
        updatedRecord.clientsUsed.push(user.clientId);
    }
    
    let putParameters = {
        TableName: configuration.data.dynamodb_taskTable,
        Item: updatedRecord,
        ConditionExpression: 'userId = :uid AND taskId = :tid',
        ExpressionAttributeValues: {
            ':uid': user.userId,
            ':tid': oldTask.taskId
        }
    };
    
    console.info('Writing to table');
    try {
        await dynamoDbClient.put(putParameters).promise();
    } catch(err) {
        console.info(err);
        throw new AWSErrors.DYNAMO_UPDATE_PUT_FAILED;
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
        case AWSErrors.DYNAMO_UPDATE_PUT_FAILED.code:
            return new Response(500, null, err);
        case AWSErrors.DYNAMO_GET_ITEM_FAILED.code:
            return new Response(404, null, err);
    }
    
    return new Response(500, { code: 500, message: 'Server failed to process your request.' });
}