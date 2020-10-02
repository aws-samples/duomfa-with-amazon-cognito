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

  const api_hostname = 'api-188ac6ad.duosecurity.com';
  
  var poolData = {
    UserPoolId: 'us-west-2_X8d8K2uzW', // Your user pool id here
    ClientId: '7v2e2ogij19lg9cpm5euj15jpr' //Your app client id here
  };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  //---------------Cognito sign-up
  function signUp(){
  
      var email = $("#reg-email").val();
      var username = $("#reg-username").val();
      var password =$("#reg-password").val();
      var name = $("#reg-name").val();
      
      var attributeList = [];
  
      var dataEmail = {Name: 'email',Value: email};
      var dataName = { Name: 'name',Value: name};
      
      var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
      var attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(dataName);
  
      attributeList.push(attributeEmail);
      attributeList.push(attributeName);
      
      userPool.signUp(username, password, attributeList, null, function(err, result ) {
        if (err) {
          console.log(err.message || JSON.stringify(err));
          return;
        }else{
          var cognitoUser = result.user;
          
          var confirmationCode = prompt("Please enter confirmation code:");
          cognitoUser.confirmRegistration(confirmationCode, true, function(err, result) {
            if (err) {
              alert(err.message || JSON.stringify(err));
              return;
            }
            console.log('call result: ' + result);
            alert("Registration successful, now sign-in.");
          });
          
          console.log('user name is ' + cognitoUser.getUsername());
        }
      });
  }

  //---------------Cognito sign-in user
  signIn = async () => {
  
      var username = $("#login-username").val();
      var password = $("#login-password").val();
      
      var authenticationData = {
        Username: username, //only username required since we will authenticate user using custom auth flow and will use security key
        Password: password
      };
      
      var userData = {
        Username: username,
        Pool: userPool,
      };
  
      var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
      cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
      
      cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');
      cognitoUser.authenticateUser(authenticationDetails, authCallBack);
        
      
  }
  
  authCallBack = {
  	
    onSuccess: function(result) {
      var accessToken = result.getAccessToken().getJwtToken();
      var idToken = result.getIdToken().getJwtToken();
      var refreshToken = result.getRefreshToken().getToken();
      
      $("#idToken").html('<b>ID Token</b><br>'+JSON.stringify(parseJwt(idToken),null, 2));
      $("#accessToken").html('<b>Access Token</b><br>'+JSON.stringify(parseJwt(accessToken),null, 2));
      //$("#refreshToken").html('<b>Refresh Token</b><br>'+refreshToken);

    },
    customChallenge: async function(challengeParameters) {
      // User authentication depends on challenge response
      
      console.log("Custom Challenge from Cognito:");console.log(challengeParameters);
      
      //render Duo MFA
      $("#duo-mfa").html('<iframe id="duo_iframe" title="Two-Factor Authentication" </iframe>');
        
      Duo.init({
        'host': api_hostname,
        'sig_request': challengeParameters.sig_request,
        'submit_callback': mfa_callback
      });
      
    },
    onFailure: function(err) {
    	console.error("Error authenticateUser:"+err);
      console.log(err.message || JSON.stringify(err));
    },
  }
  
  mfa_callback = async (data) =>{
    $("#duo-mfa").html('');
    
    console.log("submit_callback:");
    cognitoUser.sendCustomChallengeAnswer(data.sig_response.value, authCallBack);
      
   }

  //tabs UI
  $( function() {
    $( "#tabs" ).tabs();
  } );

  //helper function
  _fetch = async (path, payload = '') => {
    const headers = {'X-Requested-With': 'XMLHttpRequest'};
    if (payload && !(payload instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(payload);
    }
    const res = await fetch(path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: headers,
      body: payload
    });
    if (res.status === 200) {
      return res.json();
    } else {
      const result = await res.json();
      throw result.error;
    }
  };
  
  function parseJwt (token) {
      var base64Url = token.split('.')[1];
      var base64 = base64Url.replace('-', '+').replace('_', '/');
      return JSON.parse(window.atob(base64));
  };
