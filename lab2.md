# Lab 2 - Deploy VM in Azure

Create a folder __automation__

```bash

cd

mkdir automation

```

In VSCode click the blue __Open Folder__

If its hidden, Click the __Files__ icon in the left menu

Select __automation__ and click __ok__

Select __Linux__

If it asks for password enter the password

Click the blue __Yes, I Trust the authors__ button

Creata a new file __azure.yml__

Add the first part below to the file

make sure you change the line user: __write your username here__ to your initials / username

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

The __-__ in  __- name:__ should be under the __s__ in the line __tasks:__ above

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

Click __Terminal__ in the menu, select __New Terminal__

Start the python virtual environment

```bash

source ../ansible/bin/activate

```

Run the playbook with __ansible-playbook azure.yml__

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

One of the last tasks in the playbook reveals the web servers public IP, copy the ip address and save it for later

[Go to Lab 3](lab3.md)
