// typing file to add types to process.env
declare namespace NodeJS {
    interface ProcessEnv {
        mysqlUser: string;
        mysqlPassword: string;
        mysqlDb: string;
        mysqlHost: string;
    }
}