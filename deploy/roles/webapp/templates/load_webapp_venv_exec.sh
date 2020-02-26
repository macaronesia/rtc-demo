#!/bin/bash
source {{ remote_user_dir_path }}/.pyenv/versions/{{ webapp_virtualenv_name }}/bin/activate
$@
