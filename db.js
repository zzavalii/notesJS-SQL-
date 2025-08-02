const {Client} = require('pg');

const client = new Client({
  user: 'postgres', // имя пользователя PostgreSQL
  host: 'localhost',     // хост (если локально, то localhost)
  database: 'UserDB',   // название вашей базы данных
  password: 'postgres', // пароль от PostgreSQL
  port: 5432,           // стандартный порт PostgreSQL
});

client.connect()
.then(() => console.log('✅ Подключено к PostgreSQL, все хорошо'))
.catch(err => console.error('❌ Ошибка подключения:', err));

module.exports = client;
