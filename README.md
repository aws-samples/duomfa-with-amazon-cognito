# DUO MFA integration with Amazon Cognito

This project is a demonestration of how to integrate Duo Multi-Factor Authentication with Amazon Cognito user pools. This demo project is developed to accompany this [blog post].

# Requirements
- AWS account and permissions to create CloudFromation stacks, Cognito resources and lambda functions
- Nodejs and NPM
- Duo account

# Deployment steps
###### Clone the project
```sh
$ git clone https://github.com/aws-samples/duomfa-with-amazon-cognito.git
$ cd duomfa-with-amazon-cognito
```
###### Create Duo account and application
Follow the [First steps] to create Duo account and an application to protect with Duo SDK from Duo dashboard.
After creating the application, note the integration key, secret key and API hostname then [Generate akey] to use with your application. You will need these three keys in the next step.

![Duo App Screenshot](img/duo-app.png?raw=true "Duo Application")

###### Create AWS resources
Create AWS resaources by running the CLI command below (replace ikey, skey and akey with the correct values from previous steps)
This command will create Cognito resources, lambda functions that will be used to drive custom authentication flow and it will also create a secret in secrets manager to store Duo keys 
```sh
$ aws cloudformation create-stack --stack-name duomfa-cognito --template-body file://aws/UserPoolTemplate.yaml --capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_IAM CAPABILITY_NAMED_IAM --parameters ParameterKey=DUOIntegrationKey,ParameterValue=ikey ParameterKey=DUOSecretKey,ParameterValue=skey ParameterKey=DUOAKey,ParameterValue=akey
```
Wait for the stack to be created successfully and then get the user-pool-id and app-client-id from outputs section. you can do this from CloudFromation console or using describe-stacks command
```sh
$ aws cloudformation describe-stacks --stack-name duomfa-cognito 
```
###### Update and run the application
Edit the file public/view-client.js to use the new user-pool that you just created.
```javascript
  const api_hostname = 'duo_api_hostname';
  
  var poolData = {
    UserPoolId: 'user_pool_id',
    ClientId: 'app_client_id'
  };
```
In the same file, change api_hostname to the value you optained from your Duo application.

Install and run the application
```sh
$ npm install
$ node server.js
```

Here is a quick demo of deploying and running this project in a fresh Cloud9 environment.

[![Watch the demo](https://webauthn-with-amazon-cognito.s3-us-west-2.amazonaws.com/WebAuthn.gif)](https://webauthn-with-amazon-cognito.s3-us-west-2.amazonaws.com/WebAuthn.mp4)

   [First Steps]: <https://duo.com/docs/duoweb#first-steps>
   [Generate akey]: <https://duo.com/docs/duoweb#1.-generate-an-akey>

## Notes about implementation
###### User registration
Registration is performed by collecting user data in UI and making a call to `signUp()` in /public/view-client.js
This call creates a user in Cognito, an automated email will be sent to verify email address and a prompt will be displayed to collect verification pin.
###### User authentication
Authentication starts by collecting username and password then making a call to `signIn()` method in /public/view-client.js
`signIn()` starts a custom authentication flow with secure remote password (SRP). Cognito then responds with a custom challenge which is used to initialize and display Due MFA iframe.

Notice the call to `cognitoUser.authenticateUser(authenticationDetails, authCallBack);` the custom challenge will be send to authCallBack function and this is where Duo SDK is initialized and used as below:

```javascript
  //render Duo MFA
  $("#duo-mfa").html('<iframe id="duo_iframe" title="Two-Factor Authentication" </iframe>');
    
  Duo.init({
    'host': api_hostname,
    'sig_request': challengeParameters.sig_request,
    'submit_callback': mfa_callback
  });
```
This will render Duo iframe to the user with instructions to either setup their MFA preferences, if this is the first sign-in attempt, or initiate MFA according to saved settings.

###### Define Auth Challenge
This lamda function is triggered when authentication flow is CUSTOM_AUTH to evaluate the authentication progress and decide what is the next step. For reference, the code of this lambda trigger is under aws/DefineAuthChallenge.js

Define auth challenge will go through the logic below to decide next challenge:

```javascript
/**
 * 1- if user doesn't exist, throw exception
 * 2- if CUSTOM_CHALLENGE answer is correct, authentication successful
 * 3- if PASSWORD_VERIFIER challenge answer is correct, return custom challenge. This is usually the 2nd step in SRP authentication
 * 4- if challenge name is SRP_A, return PASSWORD_VERIFIER challenge. This is usually the first step in SRP authentication
 * 5- if 5 attempts with no correct answer, fail authentication
 * 6- default is to respond with CUSTOM_CHALLENGE --> password-less authentication
 * */
```

###### Create Auth Challenge
This lambda function is triggered when the next step (returned from define auth challenge) is CUSTOM_CHALLENGE. For reference, the code of this lambda trigger is under aws/CreateAuthChallenge.js

This function will load Duo keys from secrets manager and store them in global variables which will make these keys availbale for the life-time of this instance of the function. this will save us a call to secrts manager everytime the function is called.

A signed request will be created using Duo APIs and returned to application as custom challenge, this is achieved by making this call `var sig_request = duo_web.sign_request(ikey, skey, akey, username);`
###### Verify Auth Challenge
This lambda will be triggered when challenge response is passed on from client to Cognito service, this is done throug the call `cognitoUser.sendCustomChallengeAnswer(data.sig_response.value, authCallBack);` 
challenge response includes the signed response generated from Duo MFA, this response will be validated using the stored Duo keys. For reference, the code of this lambda trigger is under aws/DefineAuthChallenge.js

Verification of a valid response should return the username that was used to create the signed request. if the verification is successful and the retuned value matches the username of the user than the challenge maked as successful.
## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

