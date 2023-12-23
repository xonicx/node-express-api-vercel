const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

db.serialize(() => {
 
  db.run('CREATE TABLE IF NOT EXISTS user_tb (id INTEGER PRIMARY KEY AUTOINCREMENT, userid TEXT, phone TEXT, address TEXT, action TEXT, purpose TEXT,comment TEXT, nextAction TEXT,nextPurpose TEXT, reminderDays INT, reminderdate datetime,createdon datetime, updatedon datetime)');
  db.run('CREATE TABLE IF NOT EXISTS user_tb_log (logid INTEGER PRIMARY KEY AUTOINCREMENT, id INTEGER, userid TEXT, phone TEXT, address TEXT, action TEXT, purpose TEXT,comment TEXT, nextAction TEXT,nextPurpose TEXT, reminderDays INT, reminderdate datetime,createdon datetime, updatedon datetime)');
});

module.exports = db;