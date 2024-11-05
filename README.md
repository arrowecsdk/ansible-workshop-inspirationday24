# ansible-workshop-inspirationday24

## Outline

In this workshop we will use ansible automation to create a linux server and a windows server in Azure

The linux server will run out node.js website

The windows server will run the local dynamoDB

## Lab Invironment

Student

Ansible

## Lab 1

Install the environment

VsCode

## Lab 2 - Deploy VM in Azure

## Lab 3 - Deploy DynamoDB to Windows Server

## Lab 4 - Deploy Website to linux Server

Install NodeJS and Website

```bash

curl -sL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh

sudo bash nodesource_setup.sh

sudo apt install nodejs -y

node --version
npm --version

mkdir note-app
cd note-app
npm init -y

npm install express aws-sdk body-parser

mkdir public

sudo npm install -g pm2

curl 'https://raw.githubusercontent.com/arrowecsdk/ansible-workshop-inspirationday24/refs/heads/main/noteapp/server.js' > server.js

curl 'https://raw.githubusercontent.com/arrowecsdk/ansible-workshop-inspirationday24/refs/heads/main/noteapp/public/index.html' > public/index.html

pm2 start server.js

pm2 status

pm2 startup

# Run the command that PM2 gives you
# Like this
# sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user

pm2 save

```

Install Nginx

```bash
sudo apt install nginx -y

sudo systemctl start nginx
sudo systemctl enable nginx

sudo tee -a //etc/nginx/sites-available/note-app.conf <<'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain if you have one

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/note-app.conf /etc/nginx/sites-enabled/

sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t

sudo systemctl restart nginx

```
