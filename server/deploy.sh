IP=134.195.90.90

npx tsx src/generateTools.ts --generate

rsync -avz dkim_private.key src build public package.json tsconfig.json package-lock.json .env.production root@$IP:/root/smarthost/

ssh root@$IP << EOF
cd /root/smarthost/public
/root/.bun/bin/bun i

cd /root/smarthost
pm2 delete all
pm2 start "npx tsx src/main.ts" --name=turbobuilt
pm2 startup
pm2 save
EOF