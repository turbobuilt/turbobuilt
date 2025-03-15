IP=168.235.84.65

# ssh into the server and apt get update, install bun, wget, multiline command
ssh root@$IP << EOF
apt-get update
apt-get install -y curl unzip

# install bun
curl -fsSL https://bun.sh/install | bash

# create dir
mkdir -p /root/smarthost/renderer

# create file to allow installing homebrew as root
touch /.dockerenv
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

cd /root
curl -O https://nodejs.org/dist/v22.6.0/node-v22.6.0-linux-x64.tar.xz
tar -xlf node-v22.6.0-linux-x64.tar.xz
rm node-v22.6.0-linux-x64.tar.xz
mv node-v22.6.0-linux-x64 node

echo 'export PATH=$PATH:/root/node/bin' >> /etc/environment

/usr/sbin/ufw disable
EOF

# scp nginx.conf root@$IP:/etc/nginx/sites-available/default

# ssh root@$IP << EOF
# systemctl enable nginx
# service nginx start
# EOF


# useradd -m -d /home/app

# NONINTERACTIVE=1 /bin/bash -c "\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"


