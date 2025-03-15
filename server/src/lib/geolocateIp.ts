import maxmind, { CityResponse } from 'maxmind';

let geoDb = null;
export async function geolocateIp(ip) {
    if (geoDb === null) {
        geoDb = await maxmind.open<CityResponse>(process.env.environment == 'development' ? '/Users/dev/Documents/geoip/GeoLite2-City.mmdb' : '/home/dreamgenerator/GeoLite2-City.mmdb');
    }
    let result = geoDb.get(ip);
    let city = result.city.names.en;
    let country = result.country.iso_code;
    let state = result.subdivisions[0]?.names.en;

    return { city, country, state };
}