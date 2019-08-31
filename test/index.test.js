'use strict';

const assert = require('assert');

const Emailer = require('../');

const config = {
  EMAIL: {
    DEAFULT_FROMEMAIL: "test-from@test.test",
    DEAFULT_FROMNAME: "Test Sender",
  },
  POSTMARK: {
    API_TOKEN: "POSTMARK_API_TEST"
  }
}

const testAgent = 'postmark';

const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

it('should load the emailer', () => {
  const emailer = new Emailer(testAgent, config);
  emailer.to = "Test Receiver <test-to@test.test>";
  emailer.subject = "Testing from mailer";
  emailer.html = "<h1>Testing</h1><p>Just a test</p>";
  emailer.text = "Testing\n\nJust a test.";
  emailer.send()
    .then(response => {
      assert.strictEqual(response.agent, testAgent);
      assert.strictEqual(isUUID.test(response.id), true);
    })
    .catch(err => {
      throw err;
    })
});
