// typescript

/*
Step 1: Import necessary dependencies and modules
Step 2: Write the async function oauthLogin that will take req and res express
Step 3: Destructure token and provider from req.body
Step 4: Check if the provider is "google"
Step 5: If it's google, use google-auth-library to verify the given token using your CLIENT_ID
Step 6: Get user information from the payload. If an error occurs, return status 404 with the error message
Step 7: Check if the provider is "apple"
Step 8: If it's apple, use the verify-apple-id-token package to verify the given token using your clientId. Also get user data.
Step 9: If the token is invalid, return status 404 with error message
Step 10: If the token is valid, fetch the user details with the given email. If the user doesn't exist, create a new one
Step 11: Create a new AuthToken and generate a token
Step 12: Return the user details and the generated token
Step 13: At the end, write the export statement for this api's route

NB: You need to replace "yourIdToken", "yourAppleClientId", "nonce", "yourClientId", "clientId", "CLIENT_ID" with your actual client IDs and values
*/

import { HttpError, route } from "../../lib/server";
import { OAuth2Client, auth } from 'google-auth-library';
import { createUser } from "./createUser"
import axios from "axios";
import { User } from "./models/User.model";
import { geolocateIp } from "../../lib/geolocateIp";
import { AuthToken } from "./models/AuthToken.model";
import db from "../../lib/db";
import { loginUser } from "./loginUser";
import { Organization } from "../organization/Organization.model";
import { UserState } from "methods/userState/UserState.model";



export interface OauthLoginResponseData {
    user: User;
    authToken: string;
    newUser: boolean;
    organizationList: Organization[];
    userState: UserState;
}

export default route(async function ({ req, isAndroidApp, isIosApp, isWeb, requestIp }, { token }): Promise<OauthLoginResponseData> {
    if (!token) {
        throw new HttpError(400, "token must be sent");
    }
    console.log("checking login google")
    

    let user: User = null;
    let email = null, displayName = null, picture;
    let isNewUser = false;
    let signupPlatform = isIosApp ? "ios" : isAndroidApp ? "android" : "web";
    var city = null, country = null, state = null;
    try {
        var { city, country, state } = await geolocateIp(requestIp);
    } catch (err) {
        console.error("error looking up ip")
        console.error(err);
    }

    const client = new OAuth2Client();
    try {
        var ticket = await client.verifyIdToken({ idToken: token });
        var payload = ticket.getPayload();
        var googleId = payload['sub'];
    } catch (err) {
        console.error(err)
        throw new HttpError(400, "Invalid token " + err);
    }
    email = payload.email;
    displayName = payload.name;
    picture = payload.picture;
    [user] = await User.fromQuery(`SELECT * FROM User where googleId = ?`, [googleId]);
    if (!user) {
        user = await createUser({ email: email, displayName, city, state, country, signupPlatform, googleId });
        console.log("created new user", user);
    } else if (!user.email) {
        await db.query(`UPDATE User SET email = ? WHERE guid = ?`, [email, user.guid]);
    }
    [user] = await User.fetch(user.guid);
    return { newUser: isNewUser, ...await loginUser(user) }
}, { public: true });