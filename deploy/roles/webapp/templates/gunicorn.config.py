# -*- coding: utf-8 -*-

bind = 'unix:{{ webapp_socket_path }}'
worker_class = 'eventlet'
workers = 1
timeout = 30
