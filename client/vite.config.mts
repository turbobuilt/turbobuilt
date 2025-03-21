// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'
import VueRouter from 'unplugin-vue-router/vite'
import * as fs from "fs";
import basicSsl from '@vitejs/plugin-basic-ssl'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import mkcert from 'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        basicSsl(),
        VueRouter(),
        Vue({
            template: { transformAssetUrls },
        }),
        // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
        Vuetify({
            autoImport: true,
            styles: {
                configFile: 'src/styles/settings.scss',
            },
        }),
        Components(),
        ViteFonts({
            google: {
                families: [{
                    name: 'Roboto',
                    styles: 'wght@100;300;400;500;700;900',
                }],
            },
        }),
    ],
    define: { 'process.env': {} },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
        extensions: [
            '.js',
            '.json',
            '.jsx',
            '.mjs',
            '.ts',
            '.tsx',
            '.vue',
        ],
    },
    server: {
        port: 3000,
        // host: '192.168.1.229',
        // port localhost 8081
        proxy: {
            '/api': {
                target: 'http://localhost:8081',
                changeOrigin: false,
            },
            '/component-preview': {
                target: 'http://localhost:8081',
                changeOrigin: false,
            },
            '/client-api': {
                target: 'http://localhost:8081',
                changeOrigin: false,
            },
            '/stripe-payment-success': {
                target: 'http://localhost:8081',
                changeOrigin: false,
            }
        },
        // https: {
        //     key: fs.readFileSync('./certs/smarthost.co.key'),
        //     cert: fs.readFileSync('./certs/smarthost.co.crt'),
        // }
    },
    optimizeDeps: {
        exclude: ['vscode-web',"@jsquash/resize"],
        entries: ["index.html"]
    }
})
