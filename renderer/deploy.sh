IP=149.28.123.144

rsync -avz src bun.lockb package.json tsconfig.json root@$IP:/root/smarthost/renderer

ssh root@$IP << EOF
cd /root/smarthost/renderer
/root/.bun/bin/bun install
EOF