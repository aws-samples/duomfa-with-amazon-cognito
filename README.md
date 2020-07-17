# DUO MFA integration with Amazon Cognito

This project is a demonestration of how to integrate Duo Multi-Factor Authentication with Amazon Cognito user pools. The full technical write-up on this topic is available in this [blog post].

# Requirements
- AWS account and permissions to create CloudFromation stacks, Cognito resources and lambda functions
- Nodejs and NPM
- Duo account

# Deployment steps
Clone the project
```sh
$ git clone https://github.com/aws-samples/duomfa-with-amazon-cognito.git
$ cd duomfa-with-amazon-cognito
```
Follow the [First steps] to create application to protect with Duo SDK.
[Generate akey] to use with your application

Create Cognito resaources and lambda triggers (replace ikey, skey and akey with the correct values from your previous steps)
```sh
$ aws cloudformation create-stack --stack-name duomfa-cognito --template-body file://aws/UserPoolTemplate.yaml --capabilities CAPABILITY_AUTO_EXPAND CAPABILITY_IAM CAPABILITY_NAMED_IAM --parameters ParameterKey=DUOIntegrationKey,ParameterValue=ikey ParameterKey=DUOSecretKey,ParameterValue=skey ParameterKey=DUOAKey,ParameterValue=akey
```
Wait for the stack to be created successfully and then get the user-pool-id and app-client-id from outputs section. you can do this from CloudFromation console or using describe-stacks command
```sh
$ aws cloudformation describe-stacks --stack-name duomfa-cognito 
```
Edit the file public/view-client.js to use the new user-pool that you just created.
```javascript
  var poolData = {
    UserPoolId: 'user_pool_id',
    ClientId: 'app_client_id'
  };
```
Install and run the application
```sh
$ npm install
$ node server.js
```

Here is a quick demo of deploying and running this project in a fresh Cloud9 environment.

[![Watch the demo](https://webauthn-with-amazon-cognito.s3-us-west-2.amazonaws.com/WebAuthn.gif)](https://webauthn-with-amazon-cognito.s3-us-west-2.amazonaws.com/WebAuthn.mp4)

   [First Steps]: <https://duo.com/docs/duoweb#first-steps>
   [Generate akey]: <https://duo.com/docs/duoweb#1.-generate-an-akey>

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

