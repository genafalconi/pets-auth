import functions from 'firebase-functions';
import admin from 'firebase-admin';
import * as pubsub from '@google-cloud/pubsub';

exports.retrieveData = functions.pubsub.topic('my-topic').onPublish(async (message) => {
  try {
    const data = JSON.parse(Buffer.from(message.data, 'utf8').toString());
    console.log(data); // replace with your processing logic
  } catch (error) {
    console.error(error);
  }
});
