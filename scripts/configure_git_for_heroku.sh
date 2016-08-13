#!/bin/bash

#-------------------------------------------------------------------------------
# This script taken from http://www.programwitherik.com/deploy-your-ember-application-to-heroku/
#
# It configures the repository for the parameter APP_NAME which should have been
# generated from the initialize_heroku_app.sh script
#-------------------------------------------------------------------------------

APP_NAME=fathomless-mesa-55736

heroku git:remote -a ${APP_NAME}

