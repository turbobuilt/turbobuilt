import db from "lib/db";
import { Website } from "methods/website/Website.model";
import mysql from "mysql2";

export async function getProductsXml(websiteGuid: string) {
    let [website] = await Website.fromQuery(`SELECT * FROM Website WHERE guid = ${mysql.escape(websiteGuid)}`);
    // find WebsitePageTemplate with url type is variable and value is 'websitePage.identifier' [{"type": "text", "value": "battery"}, {"type": "variable", "value": "websitePage.identifier"}]
    let websitePageTemplates = await db.query(`SELECT WebsitePageTemplate.*, WebsiteWebsitePageTemplate.urlOverride, WebsiteWebsitePageTemplate.url
        FROM WebsitePageTemplate
        LEFT JOIN WebsiteWebsitePageTemplate ON (WebsiteWebsitePageTemplate.websitePageTemplate = WebsitePageTemplate.guid)
        WHERE (WebsiteWebsitePageTemplate.website = ${mysql.escape(website.guid)} OR (WebsitePageTemplate.addToAllSites = 1 AND WebsitePageTemplate.organization = ${mysql.escape(website.organization)}))
        AND (
            (
                JSON_CONTAINS(WebsitePageTemplate.defaultUrl, '{"type": "variable", "value": "websitePage.identifier"}')
                AND (WebsiteWebsitePageTemplate.urlOverride = 0 OR WebsiteWebsitePageTemplate.urlOverride IS NULL)
            )
            OR (
                JSON_CONTAINS(WebsiteWebsitePageTemplate.url, '{"type": "variable", "value": "websitePage.identifier"}')
                AND WebsiteWebsitePageTemplate.urlOverride = 1
            )
        )
    `);
    console.log(websitePageTemplates);

    let items = await db.query(`SELECT Item.*, WebsitePage.identifier as websitePageIdentifier, JSON_ARRAYAGG(JSON_OBJECT(
            'name', ItemProperty.name,
            'value', ItemProperty.value
        )) AS properties
        FROM Item
        LEFT JOIN ItemProperty ON (Item.guid=ItemProperty.item AND ItemProperty.organization = ${mysql.escape(website.organization)})
        JOIN WebsiteItem ON (WebsiteItem.item = Item.guid AND WebsiteItem.website = ${mysql.escape(websiteGuid)})
        JOIN WebsitePageItem ON (WebsitePageItem.item = Item.guid AND WebsitePageItem.organization = ${mysql.escape(website.organization)})
        JOIN WebsitePage ON (WebsitePage.guid = WebsitePageItem.websitePage AND WebsitePage.organization = ${mysql.escape(website.organization)})
        WHERE Item.organization = ${mysql.escape(website.organization)}
        GROUP BY Item.guid, WebsitePage.identifier
    `);
    console.log(items);

    let pages = [];
    for (let websitePageTemplate of websitePageTemplates) {
        for (let item of items) {
            let urlToUse = websitePageTemplate.urlOverride ? websitePageTemplate.url : websitePageTemplate.defaultUrl;
            let urlString = '';
            for (let part of urlToUse) {
                urlString += '/';
                if (part.type === 'text') {
                    urlString += part.value;
                } else if (part.type === 'variable') {
                    if (part.value === 'websitePage.identifier') {
                        urlString += item.websitePageIdentifier;
                    }
                }
            }
            pages.push({
                url: urlString,
                item: item,
                price: parseFloat(item.properties.find(prop => prop.name === 'price')?.value?.value) || null
            });
        }
    }

    let itemsXml = pages.map(page => {
        return `
<item>
    <g:id>${page.item.guid}</g:id>
    <g:title>${page.item.name}</g:title>
    <g:description></g:description>
    <g:link>https://${website.domain}${page.url}</g:link>
    <g:image_link>https://</g:image_link>
    <g:condition>new</g:condition>
    <g:availability>in_stock</g:availability>
    <g:price>${page.price} USD</g:price>
    <g:shipping>
        <g:country>US</g:country>
        <g:postal_code>77493</g:postal_code>
        <g:postal_code>77494</g:postal_code>
        <g:postal_code>77491</g:postal_code>
        <g:postal_code>77492</g:postal_code>
        <g:postal_code>77406</g:postal_code>
        <g:postal_code>77449</g:postal_code>
        <g:postal_code>77450</g:postal_code>
        <g:postal_code>77407</g:postal_code>
        <g:postal_code>77094</g:postal_code>
        <g:postal_code>77413</g:postal_code>
        <g:postal_code>77218</g:postal_code>
        <g:postal_code>77083</g:postal_code>
        <g:postal_code>77498</g:postal_code>
        <g:postal_code>77084</g:postal_code>
        <g:postal_code>77487</g:postal_code>
        <g:postal_code>77082</g:postal_code>
        <g:postal_code>77077</g:postal_code>
        <g:postal_code>77079</g:postal_code>
        <g:service>Standard - Katy/West Houston ONLY</g:service>
        <g:price>0</g:price>
    </g:shipping>
    <g:gtin></g:gtin>
    <g:brand></g:brand>
</item>`
    })

    var xml = `
<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
    <channel>
        <title>Example - Google Store</title>
        <link>https://store.google.com</link>
        <description>This is an example of a basic RSS 2.0 document containing a single item</description>
        ${itemsXml.join("\n")}
    </channel>
</rss>`
    return xml.trim()
}