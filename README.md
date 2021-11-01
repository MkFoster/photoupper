# photoupper
A photo upload, processing, and viewing web application for events.  Photo Upper leverages

## Setup notes
* The Anypoint project will need a src/main/resources/local.properties file with the following assigned: aws.access.key, aws.secret.key, and https.port=8082
* The AWS Lambda functions will need a role with rights to the S3 bucket where the static content is stored, the applicable DynamoDB tables, Cloudwatch logs.
* You will need two DynamoDB tables:
PhotoUpperEvents: with eventCode as the partition key
PHotoUpperPhotos: with photoID as the partiion key and eventCode as the sort key
* You will need a global second index on the PhotoUpperPhotos table for eventCode named eventCode-index. Make sure the Lambda has rights to use this index.
* Store the static files on the S3 bucket and setup a AWS Cloudfront distribution with the S3 bucket as the source.
* Assign an SSL cert to the Cloudfront distribution via AWS Certificate Manager
* Create at least one event in the PhotoUpperEvents table with an event code and description
