//dotenv - if production get .env
// if development, get .env.development

import { hostname } from "os";
console.log("the cwd is ", process.cwd(), process.platform)
if (process.platform === 'darwin' || hostname() === "c" || process.cwd() === "/root/prg/smarthost/server" || process.env.NODE_ENV === "development") {
    process.env.NODE_ENV = 'development';
    console.log("is development")
    require('dotenv').config({ path: '.env.development' });
} else {
    process.env.NODE_ENV = 'production';
    require('dotenv').config({ path: '.env.production' });
}