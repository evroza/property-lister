import 'module-alias/register';
import { Dialect, Sequelize } from 'sequelize';
import config from '@config/index';

const db = config.get('db');
const { dialect, host, port, name, password, username } = db;

const sequelize = new Sequelize(name, username, password, {
    host,
    port : Number(port),
    dialect: dialect as Dialect
  });


/* WARNING THIS WILL DROP THE CURRENT DATABASE */
initialize();

async function initialize() {
    // sync all models with database
    await sequelize.query('CREATE SCHEMA IF NOT EXISTS properties');
    await sequelize.query(`
        create table IF NOT EXISTS properties.listings
          (
              id                 serial
                  constraint id
                      primary key,
              "propertyId"       varchar(10)             not null
                  constraint "propertyIdUnique"
                      unique,
              hash               varchar(35)             not null,
              "activeExpression" integer,
              "createdAt"        timestamp default now() not null,
              "updatedAt"        timestamp default now(),
              "isDeleted"        integer   default 0     not null
                  constraint listings_is_deleted_check
                      check ("isDeleted" = ANY (ARRAY [0, 1]))
        );
    `);
    await sequelize.query(`
          create table IF NOT EXISTS properties.listing_expressions
            (
                id                 serial
                    constraint listing_expressions_id
                        primary key,
                "listingId"        integer
                    constraint listing_id
                        references properties.listings,
                meta               json                    not null,
                "isDeleted"        integer   default 0     not null
                    constraint listing_expressions_is_deleted_check
                        check ("isDeleted" = ANY (ARRAY [0, 1])),
                "isEdit"           integer   default 0
                    constraint listing_expressions_is_edit_check
                        check ("isEdit" = ANY (ARRAY [0, 1])),
                "parentExpression" integer
                    references properties.listing_expressions,
                "createdAt"        timestamp default now() not null,
                "updatedAt"        timestamp default now()
            );
    `);
    await sequelize.query(`
        create table IF NOT EXISTS properties.jobs
            (
                id          serial
                    constraint jobs_id
                        primary key,
                status      integer,
                payload     text,
                result      text,
                error       text,
                "createdAt" timestamp default now() not null,
                "updatedAt" timestamp default now() not null
            );    
    `);

}
