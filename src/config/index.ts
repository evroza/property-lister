import * as dotenv from 'dotenv';
import convict from 'convict';
dotenv.config();

const config = convict({
  port: {
    doc: 'The port express is served on.',
    format: Number,
    default: 3001,
    env: 'APP_PORT',
  },
  listingsEndpoint: {
    doc: '3rd party endpoint to fetch listings from',
    default: 'http://localhost',
    env: 'PROPERTIES_ENDPOINT',
  },  
  db : {
    dialect: {
      doc: 'SQL Dialect of the primary database',
      default: 'postgres',
      env: 'DB_DIALECT',
    },
    host: {
      doc: 'The host address where primary DB is located',
      default: 'postgres',
      env: 'DB_HOST',
    },
    port: {
      doc: 'The host port where primary DB is located',
      default: '5432',
      env: 'DB_PORT',
    },
    name: {
      doc: 'The DB name for primary database',
      default: 'postgres',
      env: 'DB_NAME',
    },
    username: {
      doc: 'The DB username cred for primary database',
      default: 'postgres',
      env: 'DB_USERNAME',
    },
    password: {
      doc: 'The DB password for primary database',
      default: 'I_AM_NOT_A_PASSWORD!',
      env: 'DB_PASSWORD',
    },
  }
});

export default config;
