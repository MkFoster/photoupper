/**
 * Returns a signed url to allow a 'PutObject' operation on the S3
 * Bucket designated via Environment Variable.
 */
const AWS = require('aws-sdk');

const buildResponse = (statusCode, body) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json',
            // In aws_proxy mode, Lambda function must return its own access control
            // header to enable CORS.
            'Access-Control-Allow-Origin': '*'
        }
    };
};

exports.handler = (event, context, callback) => {
    console.log('Event: ', JSON.stringify(event, null, 4));

    let params = {
        Bucket: process.env.UPLOAD_BUCKET,
        Key: 'upload/' + decodeURIComponent(event.name)
    };
    
    let s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        signatureVersion: 'v4'});
    s3.getSignedUrl('putObject', params, (error, data) => {
        if (error) {
          console.error(error);
          callback(error, null);
        } else {
          callback(null, buildResponse( 200, { "url": data } ));
        }
    });
};