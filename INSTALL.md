<h1 align="center">Install</h1>
<p align="center">This Guide will help you install Meiling Gatekeeper in no time.</p>
<p align="right"><b>Last Update:</b> v.0.3.1</p>

## Getting Started
Hello, Welcome to Meiling Gatekeeper, an oAuth2 based authentication engine to build your customized login in no time.

## Installing Dependenices
### Installing Node
Meiling engine works best with latest LTS version of Node, Please go [here](https://nodejs.org/en/) to install it by yourself.

### Installing Yarn
Meiling engine uses [yarn](https://yarnpkg.com) for managing dependencies of application.  

> 💡 **Note**  
> Currently Yarn 1.x is preferred due to compatibility issues. 

### Installing node_modules
Meiling engine does depend on lots of packages on npmjs.org which does not come out of box.  
Please install `node_modules` with `yarn` command.  

### (Optional) Generate Prisma Definition Files
On postinstall of node_modules or any updates, `yarn` should automatically generate prisma definition files. you can generate prisma definition files via `node_modules`.  

Please run `yarn generate` if the prisma definition files are not properly generated.  

## Configuring Environment Variables
Meiling engine comes with various config methods.  
If you are using [config.env.js](/config.env.js) based configuration for Docker deployment or etc., It will be handy for you if you use [sample .env file (.env.example)](/.env.example) shipped with this repository. In order to use it, just copy `.env.example` to `.env`

### Make Meiling use configs from environment variables (e.g. Docker Deployment)
Copy [config.env.js](/config.env.js) to `config.js`.  

## Setting up Database

### Setting Database Provider
Meiling uses [prisma](https://prisma.io), a next-generation ORM for Node.JS. Therefore, you can use multiple database provider for meiling by your taste.
  
> 💡 **Note**  
> Prisma level of Json type support is required for meiling to function correctly.
> 
> Currently unsupported Database: *SQLite*.  
> Please refer to [Prisma Docs](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference/#json) to get up-to-date information.

Meiling is designed with MariaDB in mind, but MySQL, PostgreSQL is also supported.

To change the database provider,  
1. go to [./prisma/schema.prisma](./prisma/schema.prisma)
2. go to datasource db -> provider
3. change it to your preferences.

### Setting Database URL
Prisma by default uses environment variables to get URL for connecting database. In order to configure database, you should configure database credentials into URL form.  

You should set environment variable `DATABASE_URL` or edit [`.env` file](/.env) to following:
* MySQL/MariaDB: `mysql://username:password@host:port/database`
* PostgreSQL: `postgresql://username:password@host:port/database?schema=public`
* Microsoft SQL Server: Please refer to [Prisma: Getting Started with Microsoft SQL Server](https://www.prisma.io/docs/concepts/components/preview-features/sql-server/sql-server-start-from-scratch-typescript#connect-your-database)

### Deploy Migration to Production
In order to deploy database migrations, run `yarn prisma migrate deploy`.  

## Configurations
Configruation of Meiling differs by configuration method  
(1. using `config.js`, 2. using environment variables)  

Please check your configuration method beforehand.

### Registering frontends
Meiling allows developers to serve multiple frontends.  

* env: `FRONTEND_URLS`
* config.js: `frontend.url` (Array)

### Configuring OpenID Issuing Authority and JWT SecretKey
These are the basic minimum for using OpenID.

#### Configuring OpenID Issuing Authority
Normally, OpenID Issuing Authority should be meiling engine's public root endpoint.  
e.g. `https://meiling.stella-api.dev`  

* env: `OPENID_ISSUING_AUTHORITY`
* config.js: `openid.issuingAuthority`

#### Configuring OpenID JWT SecretKey
These are the secret key to sign your OpenID Token. Please make sure this is long enough and random enough.

* env: `OPENID_SECRET_KEY`
* config.js: `openid.secretKey`

### Configuring Port to Listen
* env: `FASTIFY_LISTEN`
* config.js: `fastify.listen`

### Configuring Meiling Public Hostname
These are the public hostname when you call meiling server.  

* env: `MEILING_HOSTNAME`
* config.js: `meiling.hostname`

### Configuring Notification API
TODO

## Start Meiling

### Transpile Typescript Code
In order to start meiling, you should compile Typescript code into JavaScript code to let node to run.  

1. Run `yarn build`

You should do this every time you edit your source code or if there is any update of Meiling.

### Run Application
You can start application by typing `yarn start`.  

