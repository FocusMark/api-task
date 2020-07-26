echo Deploying into the $deployed_environment environment.
npm install

# Execute the SAM CLI Deploy command to upload the Lambdas to S3 and deploy them
sam_stack_name=focusmark-"$deployed_environment"-sam-api-task
sam_template_file='template.sam'
sam_s3_bucket_name=focusmark-$deployed_environment-s3-deployments

sam deploy \
  --template-file $sam_template_file \
  --stack-name $sam_stack_name \
  --parameter-overrides TargetEnvironment=$deployed_environment \
  --s3-bucket $sam_s3_bucket_name \
  --s3-prefix focusmark-$deployed_environment-sam-api_task \
  --capabilities CAPABILITY_NAMED_IAM
  
# Execute the CloudFormation template needed to map the API Gateway associated with the above SAM tempalte
# to the existing custom domain deployed with the core infrastructure
cf_stack_name=focusmark-"$deployed_environment"-cf-apiTaskDomainMapping
cf_template_file='domain-mapping.yaml'

aws cloudformation deploy \
  --template-file $cf_template_file \
  --stack-name $cf_stack_name \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides TargetEnvironment=$deployed_environment