let AWSXRay = require('aws-xray-sdk');
let AWS = AWSXRay.captureAWS(require('aws-sdk'));

const { FMErrors, AWSErrors } = require('../shared/errors');
const Response = require('../shared/response');
const Configuration = require('../shared/configuration');

let configuration = new Configuration();
let dynamoDbClient = new AWS.DynamoDB.DocumentClient();

exports.projectDeletedEventHandler = async (event) => {
    console.info('Executing Project Event Subscription handler');
    let eventDetails = parseEvent(event.Records[0].Sns);
    
    // Query for the tasks associated with the project deleted
    let tasks = await getAllTasks(eventDetails.user, eventDetails.projectId);
    await deleteTasks(eventDetails.user, tasks);
    
    return new Response(200);
}

function parseEvent(event) {
    console.info(`Parsing message for topic ${event.TopicArn} notification ${event.MessageId}`);
    let deletedProject = JSON.parse(event.Message);
    if (!deletedProject) {
        throw FMErrors.MALFORMED_PROJECT_EVENT;
    }
    
    console.info(`Parsing completed. Found Project ${deletedProject.projectId} for user`);
    return {
        projectId: deletedProject.projectId,
        user: event.MessageAttributes.Owner.Value,
    };
}

async function deleteTasks(userId, tasks) {
    console.info(`Deleting the project for user ${userId}`);
    for(let index in tasks) {
        let element = tasks[index];

        let params = {
            TableName: configuration.data.dynamodb_taskTable,
            Key: { userId: userId, taskId: element.taskId },
        };
        
        try {
            console.info(`Deleting ${JSON.stringify(params.Key)}`);
            await dynamoDbClient.delete(params).promise();
            
        } catch(err) {
            console.info(err);
            throw AWSErrors.DYNAMO_GET_PROJECT_FAILED;
        }
    }
    
    console.info('Deletion completed');
}

async function getAllTasks(userId, projectId) {
    console.info(`Querying all Tasks for user`);
    
    let collectingData = true;
    let lastTaskId;
    let tasks = [];
    
    while(collectingData) {
        let params = {
            TableName: configuration.data.dynamodb_taskTable,
            ExpressionAttributeValues: {
                ':uid': userId,
                ':projectId': projectId,
            },
            ProjectionExpression: 'taskId',
            FilterExpression: 'projectId = :projectId',
            KeyConditionExpression: 'userId = :uid',
            Limit: 50,
            ReturnConsumedCapacity: "TOTAL",
        };
        
        if (lastTaskId) {
            params.ExclusiveStartKey = {
            taskId: lastTaskId,
            userId: userId,
        };
        }
        try {
            let queryResults = await dynamoDbClient.query(params).promise();
            if (queryResults.LastEvaluatedKey) {
                lastTaskId = queryResults.LastEvaluatedKey.taskId;
            } else {
                collectingData = false;
            }
            console.info(`Query pass completed with ${queryResults.Items.length} items found`);
            
            tasks = tasks.concat(queryResults.Items);
        } catch (err) {
            console.info(err);
            throw AWSErrors.DYNAMO_GET_ALL_PROJECTS_FAILED;
        }
    }
    
    return tasks;
}
