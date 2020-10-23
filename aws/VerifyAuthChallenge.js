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
    console.log(event);
    
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

    
    var username = event.userName;
    
    //-------get challenge ansower
    //const sig_Response = JSON.parse(event.request.challengeAnswer);
    const sig_response = event.request.challengeAnswer;
    console.log(sig_response);
    const verificationResult = duo_web.verify_response(ikey, skey, akey, sig_response);
    
    console.log("Verification Results:"+verificationResult);
    
    if (verificationResult === username) {
        event.response.answerCorrect = true;
    } else {
        event.response.answerCorrect = false;
    }
    return event;
};





