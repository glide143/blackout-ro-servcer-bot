'use strict';


const express = require('express');
const bodyParser = require('body-parser');
const { dialogflow } = require('actions-on-google');
   
  // Create an app instance
   
  const app = dialogflow();
   
  // Register handlers for Dialogflow intents
   
  app.intent('Default Welcome Intent', conv => {
    conv.ask('Hi, how is it going?')
    conv.ask(`Here's a picture of a cat`)
    conv.ask(new Image({
      url: 'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/160204193356-01-cat-500.jpg',
      alt: 'A cat',
    }))
  });
   
  // Intent in Dialogflow called `Goodbye`
  app.intent('Goodbye', conv => {
    conv.close('See you later!')
  });
   
  app.intent('Default Fallback Intent', conv => {
    conv.ask(`I didn't understand. Can you tell me something else?`)
  });

  const expressApp = express().use(bodyParser.json());
  expressApp.post('/fulfillment', app);

  expressApp.listen(3000);