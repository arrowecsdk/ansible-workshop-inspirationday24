# Lab 3 - Deploy DynamoDB to Windows Server

## Dynamic Inventory

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

## DynamoDB Playbook

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
- name: Install DynamoDB
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

Run the playbook using the dynamic inventory

```bash

ansible-playbook -i servers.azure_rm.yml db.yml

```
