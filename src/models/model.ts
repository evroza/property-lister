import { Dialect, Sequelize } from 'sequelize';
import config from '../config';

const db = config.get('db');
const { dialect, host, port, name, password, username } = db;

export const sequelize = new Sequelize(name, username, password, {
    host,
    port : Number(port),
    dialect: dialect as Dialect
  });
