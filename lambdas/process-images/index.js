"use strict";
const aws = require('aws-sdk');
const s3 = new aws.S3();
const docClient = new aws.DynamoDB.DocumentClient();
const sharp = require('sharp');

const smallImageWidth = 450;
const smallImagePath = 'images/small/';

const mediumImageWidth = 800;
const mediumImagePath = 'images/medium/';

const largeImageWidth = 1400;
const largeImagePath ='images/large/';

exports.handler = async (event) => {
    //Depending on the timing, the object might not be available in S3 yet
    //so retry a few times with a delay between.
    for (let retries = 0;; retries++) {
        try {
            console.log('Event: ', JSON.stringify(event, null, 4));
    
            const filename = event.filename;
            const photoID = filename.split('.')[0];
            
            console.log('Fetching events from DynamoDB.');
            var getEventsParams = {
                TableName: "PhotoUpperEvents",
                Key: {"eventCode": event.eventCode}
            };
            const eventObj = await docClient.get(getEventsParams).promise();
            console.log('Events Obj: ', eventObj);
            if (!eventObj.hasOwnProperty('Item')) {
                console.log('Bad event code!');
                const response = {
                    statusCode: 403,
                    body: 'Invalid event code!',
                };
                return response;
            } 

            const params = { Bucket: process.env.BUCKET, Key: `upload/${filename}` };
            console.log('getObject params: ', params);
            
            const imageObj = await s3.getObject(params).promise();
            
            console.log('Image retrieved from S3.');
            const image = await sharp(imageObj.Body);
            console.log('Sharp image created.');
            const imageMetadata = await image.metadata();
            console.log('Metadata retrieved.');
            
            // Small/thumbnail sized images
            let smallImageBuffer;
            if (imageMetadata.width > smallImageWidth) {
                smallImageBuffer = await image.resize({width: smallImageWidth}).toFormat('webp').toBuffer();
            } else {
                smallImageBuffer = await image.toFormat('webp').toBuffer();
            }
            await s3.putObject({ Bucket: process.env.BUCKET, Body: smallImageBuffer, Key: smallImagePath + photoID + '.webp'}).promise();
            console.log('Small image created.');
            
            // Medium sized images
            let mediumImageBuffer;
            if (imageMetadata.width > mediumImageWidth) {
                mediumImageBuffer = await image.resize({width: mediumImageWidth}).toFormat('webp').toBuffer();
            } else {
                mediumImageBuffer = await image.toFormat('webp').toBuffer();
            }
            await s3.putObject({ Bucket: process.env.BUCKET, Body: mediumImageBuffer, Key: mediumImagePath + photoID + '.webp'}).promise();
            console.log('Medium image created.');
            
            //Full sized images
            let largeImageBuffer;
            if (imageMetadata.width > largeImageWidth) {
                largeImageBuffer = await image.resize({width: largeImageWidth}).toFormat('webp').toBuffer();
            } else {
                largeImageBuffer = await image.toFormat('webp').toBuffer();
            }
            await s3.putObject({ Bucket: process.env.BUCKET, Body: largeImageBuffer, Key: largeImagePath + photoID + '.webp'}).promise();
            console.log('Large image created.');
            
            console.log('Writing image metadata to DynamoDB.');
            const dynamodbParams = {
                TableName: "PhotoUpperPhotos",
                Item: {
                    photoID: photoID,
                    eventCode: event.eventCode,
                    uploadDate: event.uploadDate,
                    caption: event.caption,
                    filename: filename
                }
            };
            await docClient.put(dynamodbParams).promise();
            
            const response = {
                statusCode: 200,
                body: {success: true},
            };
            console.log('Done here.  Response: ', response);
            return response;
        } catch(err) {
            if (retries < 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            } else {
                console.error('failed', err);
                const response = {
                    statusCode: 500,
                    body: err,
                };
                return response;
            }
        }
    }
    
};
