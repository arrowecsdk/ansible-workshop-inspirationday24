# Manual Steps

## DB

```powershell
#download java
Invoke-WebRequest -Uri https://download.oracle.com/java/17/archive/jdk-17.0.12_windows-x64_bin.msi -Outfile jdk-17.0.12_windows-x64_bin.msi

#Install java
msiexec /i jdk-17.0.12_windows-x64_bin.msi /qb

#download dynamodb
Invoke-WebRequest -Uri https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.zip -Outfile dynamodb_local_latest.zip

#unzip dynamodb
Expand-Archive dynamodb_local_latest.zip -DestinationPath dynamodb

open firewall port 8000

#run dynamodb

cd dynamodb
java -D"java.library.path=./DynamoDBLocal_lib" -jar DynamoDBLocal.jar

```

Extra install aws-cli and connect to dynamodb

```powershell

#download aws cli
Invoke-WebRequest -Uri https://awscli.amazonaws.com/AWSCLIV2.msi -Outfile AWSCLIV2.msi

#install aws cli
msiexec.exe /i AWSCLIV2.msi /qn

#configure aws cli
aws configure

account: dummy
secret: dummy
region: us-east-1

#list tables
aws dynamodb list-tables

```

## Web

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

curl 'https://raw.githubusercontent.com/arrowecsdk/ansible-workshop-inspirationday24/refs/heads/main/noteapp/dynamodb-config' > dynamodb-config

curl 'https://raw.githubusercontent.com/arrowecsdk/ansible-workshop-inspirationday24/refs/heads/main/noteapp/createTable.js' > createTable.js

curl 'https://raw.githubusercontent.com/arrowecsdk/ansible-workshop-inspirationday24/refs/heads/main/noteapp/public/index.html' > public/index.html

Change IP in dynamodb-config

nodejs createTable.js

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

sudo tee -a /etc/nginx/sites-available/note-app.conf <<'EOF'
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
