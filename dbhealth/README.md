# SafeHaven dbhealth checker tool

This tool is a typescript script which checks and validates the objects present in the SafeHaven database.  
It can be useful to detect inconsistencies between the SQL data and the business objects.

## Pre-requisites

- The requirements are the same as the SafeHaven app, and you should run this tool from the nix develop shell

## Install dependencies

First, run `npm ci` in the dbhealth folder to install the relevant dependencies.

## Configure

The tool uses the environment variables SH__DATABASE__URL or DATABASE_URL in order to connect to the SafeHaven database.  
The syntax is the same as the SafeHaven app, and the nix flake sets DATABASE_URL so you may not have to set it yourself unless you need to customize it.

In case you need to set it :

```
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/safehaven"
```

## Run

The tool is very basic right now, assuming the environment variable is set, all you have to do is run `npm run dbhealth` from the dbhealth folder.

You can also set the environment variable at the same time :

```
DATABASE_URL="postgres://postgres:postgres@localhost:5432/safehaven" npm run dbhealth
```
