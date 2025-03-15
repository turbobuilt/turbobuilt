# start ssh agent
eval $(ssh-agent -s)
ssh-add ~/.ssh/id_rsa
cd client
./deploy.sh
cd ../server
./deploy.sh