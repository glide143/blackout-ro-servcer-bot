'use strict';


const express = require('express');
const bodyParser = require('body-parser');
const { dialogflow } = require('actions-on-google');
   
  // Create an app instance
   
  const app = dialogflow();
   
  // Register handlers for Dialogflow intents
   
app.intent('Default Welcome Intent', conv => {
  conv.ask('How are you?');
});

  const expressApp = express().use(bodyParser.json());
  expressApp.post('/fulfillment', app);

  expressApp.listen(8080);