import { Client } from '@duosecurity/duo_universal';
import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

let secretName = process.env.DUO_SECRET,
    secret;

let redirectUrl = process.env.REDIRECT_URL; //callback

let smClient = new SecretsManagerClient({});

let clientId = null;
let clientSecret = null;
let apiHost = null;

export const handler = async (event) => {
    console.log(event);

    if (clientId == null || clientSecret == null || apiHost == null) {

        console.log("----------------Loading duo keys");
        try {
            const data = await smClient.send(new GetSecretValueCommand({ SecretId: secretName }));
            if ('SecretString' in data) {
                secret = JSON.parse(data.SecretString);
                clientId = secret['duo-clientid'];
                clientSecret = secret['duo-clientsecret'];
                apiHost = secret['duo-apihostname'];
            }
        }
        catch (err) {
            console.error(err);
            throw err;
        }

    }

    var username = event.userName;

    //-------get challenge ansower
    const duoCode = event.request.challengeAnswer;

    const client = new Client({
        clientId,
        clientSecret,
        apiHost,
        redirectUrl,
    });

    try {

        const verificationResult = await client.exchangeAuthorizationCodeFor2FAResult(duoCode, username);

        console.log("Verification Results:" + verificationResult);

        event.response.answerCorrect = true;
        return event;
    } catch (err) {
        event.response.answerCorrect = false;
        return event;
    }
};
