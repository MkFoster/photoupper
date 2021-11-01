"use strict";
const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient();

exports.handler = async (event) => {

    const params = {
        TableName: 'PhotoUpperPhotos',
        IndexName: 'eventCode-index',
        KeyConditionExpression: 'eventCode = :evtCd',
        ExpressionAttributeValues: {":evtCd": event.eventCode }
    };
    const photos = await docClient.query(params).promise();
    
    const paramsEvents = {
        TableName: 'PhotoUpperEvents',
        KeyConditionExpression: 'eventCode = :evtCd',
        ExpressionAttributeValues: {":evtCd": event.eventCode }
    };
    const eventInfo = await docClient.query(paramsEvents).promise();
    console.log('EventInfo: ', eventInfo);
    
    const body = {
        eventInfo: eventInfo.Items[0],
        photos: photos.Items
    }

    const response = {
        statusCode: 200,
        body: body
    };
    return response;
};
