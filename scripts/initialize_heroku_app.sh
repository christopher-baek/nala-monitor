#!/bin/bash

#-------------------------------------------------------------------------------
# This script taken from http://www.programwitherik.com/deploy-your-ember-application-to-heroku/
#
# It creates a new Heroku application
#-------------------------------------------------------------------------------

heroku create --buildpack https://github.com/tonycoco/heroku-buildpack-ember-cli.git

