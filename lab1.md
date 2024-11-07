# Lab 1

## Install and Configure Windows Workstation

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

### SSH Keypair for web server

We need a ssh keypair for the linux server "web"

Run ssh-keygen

```bash

ssh-keygen

Hit "Enter" for defaults

```
