# rtc-demo

A full stack WebRTC app with React & Flask

## Features

- **Signaling server:** The project comes with a signaling server which is based on Flask-SocketIO
- **Authentication:** Token based authentication (JWT)
- **Deployment:** A bundle of deployment scripts based on Ansible are provided for simplification, which includes both web server and STUN/TURN server

## Prerequisites
  - Node.js
  - Yarn
  - Ansible

## How to deploy

1. Substitute following constants as specified by each file with your domain name:

    - **API_URL_BASE**, **SOCKET_IO_BASE** in `/client/src/constants/environmentConstants.js`
    - **TURN_SERVICE_DOMAIN** in `/server/config.py`
    - **hosts** in `/deploy/hosts.yml`

2. Install dependencies and create a build of the client
    ```bash
    $ cd client
    $ yarn
    $ yarn build
    ``` 

3. Media capture API getUserMedia() must be called from an HTTPS URL, so SSL must be enabled on the web server.

    Place the certificate file and the private key file of your domain into `/deploy/secrets/`, and rename them to `domain-bundle.crt` and `domain.key` separately.

4. Substitute constant **remote_user** in `/deploy/group_vars/all` with the user for deployment

5. Deploy to the server (Ubuntu 18.04)
    ```bash
    $ cd deploy
    $ ansible-playbook site.yml -i hosts.yml --ask-pass
    ```
