<h1 align="center">Install</h1>
<p align="center">This Guide will help you install Meiling Gatekeeper in no time.</p>
<p align="right"><b>Last Update:</b> v.0.7.0-SNAPSHOT</p>

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
Please install node dependencies with `yarn` command.  

### (Optional) Generate Prisma Definition Files
On postinstall of node_modules or any updates, `yarn` should automatically generate prisma definition files. you can generate prisma definition files via `prisma`'s internal commands.  

Please run `yarn generate` if the prisma definition files are not properly generated.  

## Configuring Environment Variables
Meiling engine comes with various config methods.  
You can use [sample .env file (.env.example)](/.env.example) shipped with this repository. In order to use it, just copy `.env.example` to `.env`

## Setting up Database

### Setting up MariaDB (or mySQL)
Meiling uses [prisma](https://prisma.io), a next-generation ORM for Node.JS with JsonFiltering that does NOT provide universal way to querying JSON filtering at the moment.  
  
Therefore, support for DBMS other than MariaDB/MySQL was dropped due to recent changes for supporting Json filtering. Sorry!  

Install MariaDB or mySQL depending on your platform.

### Setting Database URL
Prisma by default uses environment variables to get URL for connecting database. In order to configure database, you should configure database credentials into URL form.  

You should set environment variable `DATABASE_URL` or edit [`.env` file](/.env) to following:
* MySQL/MariaDB: `mysql://username:password@host:port/database`
* PostgreSQL: `postgresql://username:password@host:port/database?schema=public`
* Microsoft SQL Server, mongoDB: Please refer to [Prisma: Getting Started with Microsoft SQL Server](https://www.prisma.io/docs/concepts/components/preview-features/sql-server/sql-server-start-from-scratch-typescript#connect-your-database)

### Deploy Database
Use `prisma db push` to deploy database to specified database you declared above.

## Configurations
From v0.4.0, Usage of `.env` is recommended than using `config.js`.  

The following is a example .env files.

### Things to configure on `.env` file
```env
### ==== CONFIGURATIONS FOR PRISMA ====

## Database

# This is a database URL for setting up database for meiling.
DATABASE_URL="mysql://username:password@host:port/database?schema=public"

### ==== CONFIGURATIONS FOR MEILING ==== 

## Meiling API configs

# Hostname of Meiling (where this api will be served)
MEILING_HOSTNAME="https://demo.meili.ng"

# Allowed Frontend URLs (comma separated)
# > These are the frontend URLs (the app user faces when using meiling)
# > These configurations are used for CORS setting of /v1/meiling endpoints
# > Therefore, preventing others webpages pretend being legitimate account webpage
FRONTEND_URLS="https://frontend-1.meili.ng,https://frontend-2.meili.ng,http://also.with.ports:3000"

# The frontend URL for device code verification
MEILING_DEVICE_CODE_VERIFICATION_URL="https://frontend.meili.ng/device"

# The listening port/socket for meiling (UNIX Sockets are supported)
FASTIFY_LISTEN=8080

# Is meiling behind a reverse proxy? (1: yes, 0: no)
FASTIFY_USE_PROXY=1



## OpenID Configuration

# The "issuer" on OpenID Connect id_token
OPENID_ISSUING_AUTHORITY="https://demo.meili.ng"

# Deprecated: use "yarn genkey" will automatically generate certificates for creating JWTs
OPENID_SECRET_KEY=""

NOTIFICATION_API_HOST="http://notification.meili.ng"
NOTIFICATION_API_KEY="notificationAPIMeilingSecret"



## Meiling Admin Configuration

# The tokens (comma separated) for accessing Administrator endpoints: /v1/admin
# > These can also be used for Basic Authorization by putting base64-ed username:password format
ADMIN_TOKENS="HakureiShrine,HongMeiling"

# Allowed Admin Frontend URLs (comma separated)
# > These are the frontend URLs for administration (the app admin faces when using meiling)
# > These configurations are used for CORS setting of /v1/admin endpoints
ADMIN_FRONTEND_URLS="https://frontend-1.meili.ng,https://frontend-2.meili.ng,http://also.with.ports:3000"

```

#### Configuring OpenID JWT SecretKey
These are the secret key to sign your OpenID Token. Please make sure this is long enough and random enough.

**Please Run the following:**  
```bash
yarn genkey
```


### Configuring Notification API
TODO

## Start Meiling

### Transpile Typescript Code
In order to start meiling, you should compile Typescript code into JavaScript code to let node to run.  

1. Run `yarn build`

You should do this every time you edit your source code or if there is any update of Meiling.

### Run Application
You can start application by typing `yarn start`.  

