product_name=$focusmark_productname

echo Deploying into the $deployed_environment environment.
npm install

# Execute the SAM CLI Deploy command to upload the Lambdas to S3 and deploy them
sam_stack_name=focusmark-"$deployed_environment"-sam-api-taskserverless
sam_template_file='template.sam'
sam_s3_bucket_name=focusmark-$deployed_environment-s3-deployments

echo Deploying the $sam_stack_name stack.
cfn-lint $sam_template_file
sam deploy \
  --template-file $sam_template_file \
  --stack-name $sam_stack_name \
  --s3-bucket $sam_s3_bucket_name \
  --s3-prefix focusmark-$deployed_environment-sam-api_task \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
      TargetEnvironment=$deployed_environment \
      ProductName=$product_name