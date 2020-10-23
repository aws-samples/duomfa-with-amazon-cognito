const duo_web = require('duo_web');

let AWS = require('aws-sdk'),
    secretName = process.env.DUO_SECRET,
    secret,
    decodedBinarySecret;
    
let smClient = new AWS.SecretsManager({});
    
let ikey = null;
let skey = null;
let akey = null;

exports.handler = async (event) => {
    
    //Load Duo keys from secrets manager
    
    if(ikey == null || skey == null || akey == null){
        
      const promise = new Promise(function(resolve, reject) {
          
          console.log("----------------Loading duo keys")
          smClient.getSecretValue({SecretId: secretName}, function(err, data) {
                if (err) {
                    console.error(err);
                    throw err;
                }
                else {
                    console.log(data);
                    if ('SecretString' in data) {
                        secret = JSON.parse(data.SecretString);
                        ikey = secret['duo-ikey'];
                        skey = secret['duo-skey'];
                        akey = secret['duo-akey'];
                    }
                }
                
                resolve();
            });
        })
        
        await promise;
        
    }
    
    //create sign request using duo SDK
    var username = event.userName;
    var sig_request = duo_web.sign_request(ikey, skey, akey, username);
    
    event.response.publicChallengeParameters = {
        sig_request: sig_request
    };
    
    console.log(event);
    return event;
};

