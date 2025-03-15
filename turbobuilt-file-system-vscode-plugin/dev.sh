# pnpm run watch-web:esbuild
pnpx nodemon -e 'ts,json' --watch 'src/**/*.ts' --exec 'node esbuild.js && cp -r dist/* ../client/public/turbobuilt-file-system-vscode-plugin/dist && cp -r package.json ../client/public/turbobuilt-file-system-vscode-plugin/package.json && cp -r package.nls.json ../client/public/turbobuilt-file-system-vscode-plugin/package.nls.json'
