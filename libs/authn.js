/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *     http://aws.amazon.com/apache2.0/
 *
 * or in the "license" file accompanying this file.
 * This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

const express = require('express');
const router = express.Router();
const duo_web = require('@duosecurity/duo_web');

router.use(express.json());

const ikey = 'DI5FZ9VA2TNRAVEWF7GH'
const skey = 'E4A06bK1b23GHdMJepbEICPxOoJIt2FB1efJovEW'
const akey = '9f09ad536b618f59b6d74b898b4a8b0a7d19a5b7'
const api_hostname = 'api-188ac6ad.duosecurity.com'
const post_action = '/'


router.post('/createSigRequest', async (req, res) => {
  //f2l.config.rpId = `${req.get('host')}`;

  try {
    username = req.body.username;
    sig_request = duo_web.sign_request(ikey, skey, akey, username);
  
    res.json({'sig_request' : sig_request});
    
  } catch (e) {
    res.clearCookie('challenge');
    res.status(400).send({ error: e.message });
  }
});

router.post('/verifySigResponse', async (req, res) => {

  try {
    sig_response = req.body.sig_response;
    results = duo_web.verify_response(ikey, skey, akey, sig_response)
  
    res.json({'verification_results' : results});
    
  } catch (e) {
    res.clearCookie('challenge');
    res.status(400).send({ error: e.message });
  }
});

module.exports = router;
