IP=134.195.90.90
npx vite build
mkdir -p public/node_modules/vscode-web/
rsync -az --delete node_modules/vscode-web/ public/node_modules/vscode-web/

# replace client/public/product.json "localhost:8008" with "portal.turbobuilt.com"
sed -i '' 's/localhost:8008/portal.turbobuilt.com/g' dist/product.json

rsync -avz --delete dist/ root@$IP:/root/smarthost/public/

# replace client/public/product.json "portal.turbobuilt.com" with "localhost:8008"
# sed -i 's/portal.turbobuilt.com/localhost:8008/g' public/product.json 