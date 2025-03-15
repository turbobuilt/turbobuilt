// typescript

/* 
Step-by-step implementation plan:
1. Import necessary modules and files.
2. Define an async function 'createUser' with input as an object containing properties email, name, provider, providerData, and password.
3. Check if password is not set, generate a random password of 16 characters long using the 'crypto' module.
4. Check if the password is less than 8 characters or equals "password", then throw an error with message "Invalid password" and code "invalid_password".
5. Create an 'AuthenticatedUser' object with the given properties.
6. Instead of storing password, hash the password using bcrypt and store it in the user object.
7. Save the user using the 'save' method on the 'AuthenticatedUser' object.
8. Finally, return the saved user.
*/

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { User } from './models/User.model';
import { Organization } from '../organization/Organization.model';
import db from '../../lib/db';
import { createOrganization } from '../organization/createOrganization';

interface CreateUserOptions { email?, displayName?, provider?, providerData?, password?, appleIdentifier?, signupPlatform?, city?, state?, country?, googleId?, appleId?, verified?}
export async function createUser(options: CreateUserOptions) {
    let { email, displayName, provider, providerData, password, appleIdentifier, signupPlatform, city, country, state, googleId, appleId, verified } = options;
    if (!password) {
        password = crypto.randomBytes(16).toString('base64');
    }

    if (password.length < 8 || password === 'password') {
        throw { error: "Invalid password", code: "invalid_password" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, displayName, passwordHash: hashedPassword, signupPlatform, city, state, country, appleId, googleId, verified });
    let organization: Organization;
    try {
        await db.transaction(async (con) => {
            await user.save({ con });
            await createOrganization(user.guid, con);
        });
        return user;
    } catch (error) {
        throw error;
    }
}