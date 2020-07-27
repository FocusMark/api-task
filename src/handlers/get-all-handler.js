let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { FMErrors, AWSErrors } = require('../shared/errors');
const QueryResponse = require('../shared/query-response');
const Configuration = require('../shared/configuration');
const JwtUser = require('../shared/jwt-user');

let configuration = new Configuration();
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();

exports.getAllHandler = async (event, context) => {
    try {
        let user = new JwtUser(event);

        let taskResults = await getAllTasks(event, user);
        return new QueryResponse(200, taskResults.tasks, null, taskResults.lastTaskId);
    } catch(err) {
        console.info(err);
        console.info('Aborting Lambda execution');
        return handleError(err);
    }
};

async function getAllTasks(event, user) {
    console.info(`Querying all Tasks for user`);
    
    let params = {
        TableName: configuration.data.dynamodb_taskTable,
        ExpressionAttributeValues: {
            ':uid': user.userId,
        },
        KeyConditionExpression: 'userId = :uid',
        Limit: configuration.data.pageSize,
        ReturnConsumedCapacity: "TOTAL",
    };
    
    if (event.queryStringParameters && event.queryStringParameters.lastId) {
        params.ExclusiveStartKey = {
            taskId: event.queryStringParameters.lastId,
            userId: user.userId,
        };
    }
    
    console.info(params);
    try {
        let queryResults = await dynamoDbClient.query(params).promise();
        let tasks = queryResults.Items;
        tasks.forEach(task => deletePrivateFields(task));
        
        console.info(`Query completed with ${tasks.length} items found`);
        
        if (queryResults.LastEvaluatedKey) {
            console.info('Additional records are available for querying in DynamoDB.');
            return { tasks: tasks, lastTaskId: queryResults.LastEvaluatedKey.taskId, };
        } else {
            console.info('Retrieved all records for the user.');
            return { tasks: tasks, };
        }
    } catch (err) {
        console.info(err);
        throw AWSErrors.DYNAMO_GET_ALL_FAILED;
    }
}

function deletePrivateFields(task) {
    delete task.createdAt;
    delete task.updatedAt;
    delete task.userId;
    delete task.clientsUsed;
}

function handleError(err) {
    
    switch(err.code) {
        case FMErrors.MISSING_AUTHORIZATION.code:
            return new QueryResponse(401, null, err);
        case AWSErrors.DYNAMO_GET_ALL_FAILED.code:
            return new QueryResponse(500, null, err);
    }
    
    return new QueryResponse(500, null, { code: 500, message: 'Server failed to process your request.' });
}