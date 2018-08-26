'use strict';


const express = require('express');
const bodyParser = require('body-parser');
const { dialogflow, 
        Suggestions,
        BasicCard,
        Button,
        SimpleResponse } = require('actions-on-google');
const {values, concat, random, randomPop} = require('./util');
const responses = require('./responses');

const AppContexts = {
  FACT: 'choose_fact-followup',
  CATS: 'choose_cats-followup',
};

/** Dialogflow Context Lifespans {@link https://dialogflow.com/docs/contexts#lifespan} */
const Lifespans = {
  DEFAULT: 5,
};



var request = require('request-promise');
var uri = 'https://blackout-ro.net/wp-admin/admin-ajax.php?action=server_status';

var _include_headers = function(body, response, resolveWithFullResponse) {
  return {'headers': response.headers, 'data': body};
};

var options = {
  method: 'GET',
  uri: uri,
  json: true,
  transform: _include_headers,
}
  // Create an app instance
   
  const app = dialogflow({
    debug: true,
    init: () => ({
      data: {
        // Convert array of facts to map
        facts: responses.categories.reduce((o, c) => {
          o[c.category] = c.facts.slice();
          return o;
        }, {}),
        cats: responses.cats.facts.slice(), // copy cat facts
      },
    }),
  });
  
  /**
   * Greet the user and direct them to next turn
   * @param {DialogflowConversation} conv DialogflowConversation instance
   * @return {void}
   */
  app.intent('Unrecognized Deep Link Fallback', (conv) => {
    const response = util.format(responses.general.unhandled, conv.query);
    const suggestions = responses.categories.map((c) => c.suggestion);
    conv.ask(response, new Suggestions(suggestions));
  });
  
  // redirect to the intent handler for tell_fact
  app.intent('choose_fact', 'tell_fact');
  
  // Say a fact
  app.intent('tell_fact', (conv, {category}) => {
    const {facts, cats} = conv.data;
    if (values(facts).every((c) => !c.length)) {
      // If every fact category facts stored in conv.data is empty,
      // close the conversation
      return conv.close(responses.general.heardItAll);
    }
    const categoryResponse =
      responses.categories.find((c) => c.category === category);
    const fact = randomPop(facts[categoryResponse.category]);
    if (!fact) {
      const otherCategory =
        responses.categories.find((other) => other !== categoryResponse);
      const redirect = otherCategory.category;
      const parameters = {
        category: redirect,
      };
      // Add facts context to outgoing context list
      conv.contexts.set(AppContexts.FACT, Lifespans.DEFAULT, parameters);
      const response = [
        util.format(responses.transitions.content.heardItAll, category, redirect),
      ];
      // If cat facts not loaded or there still are cat facts left
      if (cats.length) {
        response.push(responses.transitions.content.alsoCats);
      }
      response.push(responses.general.wantWhat);
      conv.ask(concat(...response));
      conv.ask(new Suggestions(otherCategory.suggestion));
      if (cats.length) {
        conv.ask(new Suggestions(responses.cats.suggestion));
      }
      return;
    }
    const {factPrefix} = categoryResponse;
    // conv.ask can be called multiple times to have the library construct
    // a single response itself the response will get sent at the end of
    // the function or if the function returns a promise, after the promise
    // is resolved.
    conv.ask(new SimpleResponse({
      speech: concat(factPrefix, fact),
      text: factPrefix,
    }));
    conv.ask(responses.general.nextFact);
    conv.ask(new BasicCard({
      title: fact,
      image: random(responses.content.images),
      buttons: new Button({
        title: responses.general.linkOut,
        url: responses.content.link,
      }),
    }));
    conv.ask(responses.general.suggestions.confirmation);
  });
  
  // Redirect to the intent handler for tell_cat_fact
  app.intent('choose_cats', 'tell_cat_fact');
  
  // Say a cat fact
  app.intent('tell_cat_fact', (conv) => {
    const {cats} = conv.data;
    const fact = randomPop(cats);
    if (!fact) {
      conv.contexts.delete(AppContexts.FACT);
      conv.contexts.delete(AppContexts.CATS);
      conv.ask(responses.transitions.cats.heardItAll);
      return conv.ask(responses.general.suggestions.confirmation);
    }
    const {factPrefix, audio} = responses.cats;
    // conv.ask can be called multiple times to have the library construct
    // a single response itself. The response will get sent at the end of
    // the function or if the function returns a promise, after the promise
    // is resolved.
    const sound = util.format(audio, random(responses.cats.sounds));
    conv.ask(new SimpleResponse({
      // <speak></speak> is needed here since factPrefix is a SSML string
      // and contains audio.
      speech: `<speak>${concat(factPrefix, sound, fact)}</speak>`,
      text: factPrefix,
    }));
    conv.ask(responses.general.nextFact);
    conv.ask(new BasicCard({
      title: fact,
      image: random(responses.cats.images),
      buttons: new Button({
        title: responses.general.linkOut,
        url: responses.cats.link,
      }),
    }));
    conv.ask(responses.general.suggestions.confirmation);
  });



  const expressApp = express().use(bodyParser.json());
  expressApp.post('/fulfillment', app);

  expressApp.listen(process.env.PORT || 8000);