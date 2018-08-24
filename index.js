'use strict';


import express from 'express';
import { json } from 'body-parser';
import { dialogflow } from 'actions-on-google';
   
  // Create an app instance
   
  const app = dialogflow();
   
  // Register handlers for Dialogflow intents
   
  app.intent('Default Welcome Intent', conv => {
    conv.ask('How are you?');
  });

  const expressApp = express().use(json());
  expressApp.post('/fulfillment', app);

  expressApp.listen(3000);