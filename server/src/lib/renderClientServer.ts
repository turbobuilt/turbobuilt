export async function renderClientServer({ req, res, body, url, host }) {
    console.log("host is", host);
    return host;
}