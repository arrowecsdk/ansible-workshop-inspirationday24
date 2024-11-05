# ansible-workshop-inspirationday24

## Outline

In this workshop we will use ansible automation to create a linux server and a windows server in Azure

The linux server will run out node.js website

The windows server will run the local dynamoDB

## Lab Invironment

Student

Ansible

## Lab 1

### Install the environment

Open a __Terminal__

Install chocolatey

```bash

Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

```

Install VSCode

```bash

choco install vscode -y

```

Exit the __Terminal__

Open a new __Terminal__

Install Remote SSH Plugin

and start VSCode

```bash

code --install-extension ms-vscode-remote.remote-ssh

code

```

In VSCode __Click__ on the bottom left corner on the blue __><__ icon

In the __Command Palet__ in the top, select __Connect to Host__

Select __+ Add new SSH Host__

Type your __username@10.1.0.4__

Select the default ssh config file

In the popup click __Connect__

In the __Command Palet__ Select __Linux__

Select __Continue__

Type your __password__

### Configure Azure access

In VSCode, click __Terminal__ in the menu and select __New Terminal__

In the terminal run the following commands

```bash

mkdir .azure

touch .azure/credentials

```

The credentials is in a text file on the desktop, __azureCredentials.txt__

copy all the content and paste it into the terminal

It will look something like this

```bash
tee -a .azure/credentials <<'EOF'
[default]
subscription_id=xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
client_id=xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
secret=xxxxxxxxxxxxxxxxx
tenant=xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
EOF
```

### Install ansible

In the terminal run the following commands

First install a python virtual environment

```bash

python3 -m venv ansible

source ansible/bin/activate

pip3 install --upgrade pip

```

Next install Ansible

Check ansible version

```bash

pip install ansible==8.7.0

ansible --version

```

Install modules for ansible

```bash

ansible-galaxy collection install azure.azcollection --force


```

Next install python modules for Windows and Azure

```bash

pip install pywinrm

pip install -r ~/.ansible/collections/ansible_collections/azure/azcollection/requirements.txt

```

### Ansible Config

We need a ssh keypair for the linux server "web"

Run ssh-keygen

```bash

ssh-keygen

Hit "Enter" for defaults

```

## Lab 2 - Deploy VM in Azure

Create a folder __automation__

```bash

cd

mkdir automation

```

In VSCode click the blue __Open Folder__

If it asks for password enter the password

Click the blue __Trust__ button

Creata a new file __azure.yml__

Add the first part below to the file

make sure you change the line user: __write your username here__ to your initials

```yaml
---
- name: Azure DBserver
  hosts: localhost
  connection: local
  vars:
    user: write your username here
    resource_group: "ansible-{{ user }}"
    location: northeurope
    ssh_public_key: "{{lookup('file', '~/.ssh/id_rsa.pub') }}"

  tasks:

```

Add the next part of the playbook

Make sure you have all the __spaces__ in the first line

```yaml
    - name: Create a public ip address for db
      azure_rm_publicipaddress:
        resource_group: "{{ resource_group }}"
        name: public_ip_db
        allocation_method: static
        tags:
            solution: "db_{{ user }}"
      register: db_pub_ip

    - name: Create Security Group for db
      azure_rm_securitygroup:
        resource_group: "{{ resource_group }}"
        name: "db_securitygroup"
        purge_rules: true
        rules:
            - name: Allow_RDP
              protocol: Tcp
              destination_port_range: 3389
              access: Allow
              priority: 100
              direction: Inbound
        tags:
            solution: "db_{{ user }}"

    - name: Create a network interface for db
      azure_rm_networkinterface:
        name: "db_nic01"
        resource_group: "{{ resource_group }}"
        virtual_network: "AutomationNetwork"
        subnet_name: "Servers"
        security_group: "db_securitygroup"
        ip_configurations:
          - name: "db_nic01_ipconfig"
            public_ip_address_name: "public_ip_db"
            primary: True
        tags:
            solution: "db_{{ user }}"
```

Save the playbook

Run the playbook with __ansible-playbook azure.yml__

If the __Terminal__ is closed in VSCode

Click __Terminal__ in the menu, select __New Terminal__

Start the python virtual environment

```bash

source ../ansible/bin/activate

```

In the __Terminal__

```bash

ansible-playbook azure.yml

```

Let the playbook run, when done you should have a green __ok=4__ and a yellow __changed=3__ if any __failed__ ask for help

Add the Virtual Machine to the playbook

Make sure you have all the __spaces__ in the first line

```yaml
    - name: Create a VM db
      azure_rm_virtualmachine:
        resource_group: "{{ resource_group }}"
        name: "db"
        os_type: Windows
        admin_username: "{{ user }}"
        admin_password: "HJKLasdf&#ery&%H"
        managed_disk_type: Premium_LRS
        state: present
        image:
          offer: WindowsServer
          publisher: MicrosoftWindowsServer
          sku: "2022-datacenter-g2"
          version: latest
        vm_size: Standard_DS1_v2
        network_interfaces: "db_nic01"
        tags:
            solution: "db_{{ user }}"
```

Save the playbook and run with ansible-playbook

In the __Terminal__

```bash

ansible-playbook azure.yml

```

Let the playbook run, when done you should have a green __ok=5__ and a yellow __changed=1__ if any __failed__ ask for help

For every task in the playbook, ansible will check if the task needs to be done or not, thats idempotency, only do a change if its needed

Now lets add the Linux server __web__ to the same playbook

```yaml
    - name: Create a public ip address for web
      azure_rm_publicipaddress:
        resource_group: "{{ resource_group }}"
        name: public_ip_web
        allocation_method: static
        tags:
            solution: "web_{{ user }}"
      register: web_pub_ip

    - name: Create Security Group for web
      azure_rm_securitygroup:
        resource_group: "{{ resource_group }}"
        name: "web_securitygroup"
        purge_rules: true
        rules:
            - name: Allow_HTTP
              protocol: Tcp
              destination_port_range: 80
              access: Allow
              priority: 100
              direction: Inbound
            - name: Allow_SSH
              protocol: Tcp
              destination_port_range: 22
              access: Allow
              priority: 110
              direction: Inbound
        tags:
            solution: "web_{{ user }}"

    - name: Create a network interface for web
      azure_rm_networkinterface:
        name: "web_nic01"
        resource_group: "{{ resource_group }}"
        virtual_network: "AutomationNetwork"
        subnet_name: "Servers"
        security_group: "web_securitygroup"
        ip_configurations:
          - name: "web_nic01_ipconfig"
            public_ip_address_name: "public_ip_web"
            primary: True
        tags:
            solution: "web_{{ user }}"

    - name: Create a VM web
      azure_rm_virtualmachine:
        resource_group: "{{ resource_group }}"
        name: "web"
        os_type: Linux
        admin_username: "{{ user }}"
        ssh_password_enabled: false
        ssh_public_keys:
          - path: "/home/{{ user }}/.ssh/authorized_keys"
            key_data: "{{ ssh_public_key }}"
        managed_disk_type: Premium_LRS
        state: present
        image:
          offer: 0001-com-ubuntu-server-jammy
          publisher: canonical
          sku: "22_04-lts-gen2"
          version: latest
        vm_size: Standard_DS1_v2
        network_interfaces: "web_nic01"
        tags:
            solution: "web_{{ user }}"

    - name: Show webserver public ip
      debug:
        msg: "{{ web_pub_ip.state.ip_address }}"

    - name: Wait for ssh on webserver
      ansible.builtin.wait_for:
        host: "{{ web_pub_ip.state.ip_address }}"
        port: 22
        delay: 10
        timeout: 600

    - name: Add webserver to ssh known_hosts
      shell: "ssh-keyscan -t ecdsa {{ web_pub_ip.state.ip_address }}  >> /home/{{ user }}/.ssh/known_hosts"

```

## Lab 3 - Deploy DynamoDB to Windows Server

### Dynamic Inventory

Set up a dynamic inventory for Azure VMs

In VSCode create a new file __servers.azure_rm.yml__

Add the inventory below

```yaml
plugin: azure_rm
auth_source: auto
include_vm_resource_groups:
  - '*'
keyed_groups:
  - prefix: tag
    key: tags

hostvar_expressions:
  ansible_host: (private_ipv4_addresses) | first

```

Save the file and test with __ansible-inventory__

```bash

ansible-inventory -i servers.azure_rm.yml --graph

```

This will output all VM's in the Azure Tenant and sort them by there tags

### DynamoDB Playbook

In VSCode create a new file __install-service.bat__

Add this batch script below

```batch
:: install-service.bat
@echo off
set SERVICE_NAME=DynamoDBLocal
set NSSM_PATH=C:\Services\nssm.exe
set BATCH_PATH=C:\Services\DynamoDB\start-dynamodb.bat

:: Remove existing service if it exists
%NSSM_PATH% stop %SERVICE_NAME%
%NSSM_PATH% remove %SERVICE_NAME% confirm

:: Install new service
%NSSM_PATH% install %SERVICE_NAME% %BATCH_PATH%
%NSSM_PATH% set %SERVICE_NAME% DisplayName "DynamoDB Local Service"
%NSSM_PATH% set %SERVICE_NAME% Description "Runs DynamoDB Local instance"
%NSSM_PATH% set %SERVICE_NAME% AppDirectory C:\Services\DynamoDB
%NSSM_PATH% set %SERVICE_NAME% AppStdout C:\Services\DynamoDB\logs\stdout.log
%NSSM_PATH% set %SERVICE_NAME% AppStderr C:\Services\DynamoDB\logs\stderr.log
%NSSM_PATH% set %SERVICE_NAME% Start SERVICE_AUTO_START

:: Start the service
%NSSM_PATH% start %SERVICE_NAME%

```

In VSCode create a new file __start-dynamodb.bat__

Add this batch script below

```batch
@echo off
:: start-dynamodb.bat
cd /d C:\Services\DynamoDB
"C:\Program Files\Java\jdk-17\bin\java.exe" -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar

```

In VSCode create a new file __db.yml__

Add the playbook below

Change the hosts: __tag_solution_db_jesbe__ so it matches you initials

__Note:__ That we present the password in the playbook in clear text - __this is NOT recommended__ - There are other ways to manage passwords and secrets in Ansible

```yaml
---
- name: Create Active Directory
  hosts: tag_solution_db_jesbe

  vars:
    ansible_user: jesbe
    ansible_password: HJKLasdf&#ery&%H
    ansible_port: 5985
    ansible_connection: winrm
    ansible_winrm_transport: ntlm
    ansible_winrm_message_encryption: always

  tasks:
    - name: Check if jdk 17 is downloaded
      ansible.windows.win_stat:
        path: C:\Users\{{ ansible_user }}\jdk-17.0.12_windows-x64_bin.msi
      register: jdkfile

    - name: Download jdk 17
      ansible.windows.win_get_url:
        url: https://download.oracle.com/java/17/archive/jdk-17.0.12_windows-x64_bin.msi
        dest: C:\Users\{{ ansible_user }}\jdk-17.0.12_windows-x64_bin.msi
        force: false
      when: not jdkfile.stat.exists

    - name: Install jdk 17
      ansible.windows.win_package:
        path: C:\Users\{{ ansible_user }}\jdk-17.0.12_windows-x64_bin.msi
        state: present

    - name: Check if dynamoDB is downloaded
      ansible.windows.win_stat:
        path: C:\Users\{{ ansible_user }}\dynamodb_local_latest.zip
      register: dynamodbfile

    - name: Download dynamoDB
      ansible.windows.win_get_url:
        url: https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.zip
        dest: C:\Users\{{ ansible_user }}\dynamodb_local_latest.zip
        force: false
      when: not dynamodbfile.stat.exists

    - name: Create DynamoDB Service + logs folder
      ansible.windows.win_file:
        path: C:\Services\DynamoDB\logs
        state: directory

    - name: Check if dynamoDB is unpacked
      ansible.windows.win_stat:
        path: C:\Services\DynamoDB\DynamoDBLocal.jar
      register: dynamodbextracted

    - name: Unzip dynamoDB
      community.windows.win_unzip:
        src: C:\Users\{{ ansible_user }}\dynamodb_local_latest.zip
        dest: C:\Services\DynamoDB
      when: not dynamodbextracted.stat.exists

    - name: Check if nssm is downloaded
      ansible.windows.win_stat:
        path: C:\Users\{{ ansible_user }}\nssm-2.24-101-g897c7ad.zip
      register: nssmfile

    - name: Download nssm
      ansible.windows.win_get_url:
        url: https://nssm.cc/ci/nssm-2.24-101-g897c7ad.zip
        dest: C:\Users\{{ ansible_user }}\nssm-2.24-101-g897c7ad.zip
        force: false
      when: not nssmfile.stat.exists

    - name: Check if nssm is unpacked
      ansible.windows.win_stat:
        path: C:\Users\{{ ansible_user }}\nssm-2.24-101-g897c7ad\win64\nssm.exe
      register: nssmextracted

    - name: Unzip nssm
      community.windows.win_unzip:
        src: C:\Users\{{ ansible_user }}\nssm-2.24-101-g897c7ad.zip
        dest: C:\Users\{{ ansible_user }}
      when: not nssmextracted.stat.exists

    - name: Copy nssm.exe
      ansible.windows.win_copy:
        src: C:\Users\{{ ansible_user }}\nssm-2.24-101-g897c7ad\win64\nssm.exe
        dest: C:\Services\nssm.exe
        remote_src: true
        backup: true

    - name: Firewall rule to allow dynamoDB port 8000
      community.windows.win_firewall_rule:
        name: DynamoDB
        localport: 8000
        action: allow
        direction: in
        protocol: tcp
        state: present
        enabled: true

    - name: Copy install service script
      ansible.windows.win_copy:
        src: install-service.bat
        dest: C:\Services\DynamoDB\install-service.bat

    - name: Copy install script
      ansible.windows.win_copy:
        src: start-dynamodb.bat
        dest: C:\Services\DynamoDB\start-dynamodb.bat

    - name: Execute install service script
      ansible.windows.win_powershell:
        script: |
          C:\Services\DynamoDB\install-service.bat

```

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
