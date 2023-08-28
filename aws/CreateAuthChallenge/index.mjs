import { Client } from '@duosecurity/duo_universal';
import {
    SecretsManagerClient,
    GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

let secretName = process.env.DUO_SECRET,
    secret;

let smClient = new SecretsManagerClient({});

let clientId = null;
let clientSecret = null;
let apiHost = null;

export const handler = async (event) => {

    //Load Duo keys from secrets manager

    if (clientId == null || clientSecret == null || apiHost == null) {

        console.log("----------------Loading duo keys");
        try {
            const data = await smClient.send(new GetSecretValueCommand({ SecretId: secretName }));
            console.log(data);
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

    const client = new Client({
        clientId,
        clientSecret,
        apiHost,
        redirectUrl: 'http://localhost:8080/',
    });

    const status = await client.healthCheck();

    console.log('Duo Server Health Check: ' + status);

    const state = client.generateState();

    //create sign request using duo SDK
    let username = event.userName;

    const authUrl = client.createAuthUrl(username, state);

    event.response.publicChallengeParameters = {
        authUrl: authUrl,
        username,
        state
    };

    console.log(event);
    return event;
};

