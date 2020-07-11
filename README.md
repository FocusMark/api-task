# api-project
Project RESTful services for FocusMark

[![BCH compliance](https://bettercodehub.com/edge/badge/FocusMark/api-project?branch=development)](https://bettercodehub.com/)
[![codebeat badge](https://codebeat.co/badges/dc4e981c-aee8-45f1-88c2-83264109a20a)](https://codebeat.co/projects/github-com-focusmark-api-project-development)

This repository holds the source code needed for the FocusMark Project REST API Endpoint. The Project resource allows for creating projects that hold children resources related to projects within FocusMark.

The API adopts the Command Query Responsibility Segregation (CQRS) pattern. This repository contains several Lambdas, one per Command or Query that is supported by the service.

# Deploy

## Requirements

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv1.html)
- [AWS SAM](https://aws.amazon.com/serverless/sam/)
- [Docker](https://docker/com)

## Environment Variables
In order to run the deployment script you must have your environment set up with a few environment variables. The following table outlines the environment variables required with example values.

| Key                               | Value Type | Description                                                                                                         | Examples                              |
|-----------------------------------|------------|---------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| deployed_environment              | string     | The name of the environment you are deploying into | dev or prod                                                    | prod                                  |
| sns_project_topic                 | string     | The ARN of the SNS Topic used for local testing and debugging of published Project events.                          | focusmark-dev-sns-projectevents       |
| dynamodb_projectEventsSourceTable | string     | The DynamoDB table used as the event source for published events. Can be AWS tables or Local DynamoDB Tables.       | focusmark-test-dynamodb-projectevents |
| dynamodb_projectTable             | string     | The DynamoDB table used to locally for testing Can be AWS tables or Local DynamoDB Tables.                          | focusmark-dev-dynamodb-projects       |
| dynamodb_endpointUrl              | string     | Should be http://dynamodb:8000 in order to interact with the local DynamoDB Table deployed as part of this document | http://dynamodb:8000                  |

In Linux or macOS environments you can set this in your `.bash_profile` file. Examples are below:

```
export deployed_environment=prod
export sns_project_topic=focusmark-dev-sns-projectevents
```

The `deployed_environment` environment variable will be used in all of the names of the resources provisioned during deployment. Using the prod environment for example, the IAM Role created to grant API Gateway access to CloudWatch will be created as `focusmark-prod-role-apigateway_cloudwatch_integration`.

The sns and dynamodb environment variables are required for local debugging and execution. Those variables are passed through to the SAM CLI when invoking the Lambdas locally. The Lambda CloudFormation templates pull the values for these from the resources it creates as part of th deployment.

## Deployment

You can deploy the API Gateway, Lambdas, SNS Topic and DynamoDB Tables by running the `./deploy.sh` script.
