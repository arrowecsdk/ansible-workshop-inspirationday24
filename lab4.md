# Lab 4 - Deploy Website to linux Server

## Install NodeJS and Website

In VSCode create a new file __package.json__

Add content below and save the file

```json
{
    "name": "note-app",
    "version": "1.0.0",
    "main": "index.js",
    "scripts": {
      "test": "echo \"Error: no test specified\" && exit 1"
    },
    "keywords": [],
    "author": "",
    "license": "ISC",
    "description": "",
    "dependencies": {
      "aws-sdk": "^2.1691.0",
      "body-parser": "^1.20.3",
      "express": "^4.21.1"
    }
  }

```

In VSCode create a new file __web.yml__

Add the playbook below

Change the hosts: __tag_solution_db_jesbe__ so it matches you initials

```yaml
---
- name: Install NodeJS and website
  hosts: tag_solution_web_jesbe

  vars:

  tasks:
    - name: Download nodesource
      ansible.builtin.get_url:
        url: https://deb.nodesource.com/setup_20.x
        dest: ~/nodesource_setup.sh
        force: false
        mode: 0770
      become: true

    - name: Setup nodesource repo
      ansible.builtin.shell: |
        ~/nodesource_setup.sh
      become: true

    - name: Install nodejs 20
      ansible.builtin.package:
        name: nodejs
        state: present
      become: true

    - name: Create note-app dir
      ansible.builtin.file:
        path: ~/note-app
        state: directory

    - name: Copy package.json
      ansible.builtin.copy:
        src: package.json
        dest: ~/note-app/package.json

    - name: Install npm packages
      community.general.npm:
        path: ~/note-app/

    - name: Create note-app / public dir
      ansible.builtin.file:
        path: ~/note-app/public
        state: directory

    - name: Install pm2 package globally
      community.general.npm:
        name: pm2
        global: true
      become: true

    - name: Download server.js
      ansible.builtin.get_url:
        url: https://raw.githubusercontent.com/arrowecsdk/ansible-workshop-inspirationday24/refs/heads/main/noteapp/server.js
        dest: ~/note-app/server.js
        force: false
        mode: 0664

    - name: Download dynamodb-config
      ansible.builtin.get_url:
        url: https://raw.githubusercontent.com/arrowecsdk/ansible-workshop-inspirationday24/refs/heads/main/noteapp/dynamodb-config
        dest: ~/note-app/dynamodb-config
        force: false
        mode: 0664

    - name: Download createTable.js
      ansible.builtin.get_url:
        url: https://raw.githubusercontent.com/arrowecsdk/ansible-workshop-inspirationday24/refs/heads/main/noteapp/createTable.js
        dest: ~/note-app/createTable.js
        force: false
        mode: 0664

    - name: Download index.html
      ansible.builtin.get_url:
        url: https://raw.githubusercontent.com/arrowecsdk/ansible-workshop-inspirationday24/refs/heads/main/noteapp/public/index.html
        dest: ~/note-app/public/index.html
        force: false
        mode: 0664

    - name: Create new dynamodb table
      ansible.builtin.shell: |
        cd ~/note-app
        nodejs createTable.js

    - name: Status pm2 server
      ansible.builtin.shell: |
        pm2 show server
      ignore_errors: true
      register: pm2show

    - name: Debug
      ansible.builtin.debug:
        msg: "{{ pm2show.stderr }}"

    - name: pm2 start server
      ansible.builtin.shell: |
        cd ~/note-app
        pm2 start server.js
      when: pm2show.stderr == "[PM2][WARN] server doesn't exist"

    - name: Wait for port 3000
      ansible.builtin.wait_for:
        port: 3000
        delay: 2
      register: portopen

    - name: Debug
      ansible.builtin.debug:
        msg: "{{ portopen }}"

    - name: Set pm2 to autostart
      ansible.builtin.shell: |
        env PATH=$PATH:/usr/bin /usr/bin/pm2 startup systemd -u {{ ansible_user_id }} --hp /home/{{ ansible_user_id }}
        pm2 save
      become: true
      when: portopen.state == "started"

    - name: Install nginx
      ansible.builtin.package:
        name: nginx
        state: present
      become: true

    - name: Enable nginx
      ansible.builtin.systemd:
        name: nginx
        state: started
        enabled: true
      become: true

    - name: Nginx Proxy Config
      ansible.builtin.blockinfile:
        path: /etc/nginx/sites-available/note-app.conf
        block: |
          server {
            listen 80;
            server_name _;

            location / {
              proxy_pass http://localhost:3000;
              proxy_http_version 1.1;
              proxy_set_header Upgrade $http_upgrade;
              proxy_set_header Connection 'upgrade';
              proxy_set_header Host $host;
              proxy_cache_bypass $http_upgrade;
            }
          }
        create: true
      become: true

    - name: Enable nginx proxy conf
      ansible.builtin.file:
        src: /etc/nginx/sites-available/note-app.conf
        dest: /etc/nginx/sites-enabled/note-app.conf
        owner: root
        group: root
        state: link
      become: true

    - name: remove nginx default conf
      ansible.builtin.file:
        path: /etc/nginx/sites-enabled/default
        state: absent
      become: true

    - name: Restart nginx
      ansible.builtin.systemd:
        name: nginx
        state: restarted
      become: true

```

Run the playbook using the dynamic inventory

Type __yes__ to the fingerprint

```bash

ansible-playbook -i servers.azure_rm.yml web.yml

```

Wait for the playbook to finish

Open a new tab in the browser and paste the web servers ip address in.

Test the web application

[Image](images/final.png)
