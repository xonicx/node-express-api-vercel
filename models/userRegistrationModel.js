const db = require('../db');
function formatSQLiteDatetime(jsDatetime) {
  const day = String(jsDatetime.getDate()).padStart(2, '0');
  const month = String(jsDatetime.getMonth() + 1).padStart(2, '0');
  const year = jsDatetime.getFullYear();
  const hours = String(jsDatetime.getHours()).padStart(2, '0');
  const minutes = String(jsDatetime.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}

const createUser = (user) => {
  console.log("create user called");

  return new Promise((resolve, reject) => {
    let jsDateforreminder = new Date();
    jsDateforreminder.setDate(jsDateforreminder.getDate() + parseInt(user.reminderDays));

    const date1 = formatSQLiteDatetime(new Date());
    const date2 = formatSQLiteDatetime(jsDateforreminder);
    console.log("converted date: ", date1);
    console.log("converted reminder date: ", date2);

    let lastInsertedId = '';

    // First INSERT operation
    const stmt = db.prepare('INSERT INTO user_tb (userid, phone, address, action, purpose, comment, nextAction, nextPurpose, reminderDays, reminderdate, createdon, updatedon) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    stmt.run(user.userid, user.phone, user.address, user.action, user.purpose, user.comment, user.nextAction, user.nextPurpose, user.reminderDays, date2, date1, date1, function (err) {
      if (err) {
        reject(err);
        console.error(err);
        stmt.finalize();
        return;
      }

      // Retrieve the last inserted ID
      lastInsertedId = this.lastID;
      console.log("lastInsertedId =", lastInsertedId);
      stmt.finalize();

      // Second INSERT operation
      const stmt2 = db.prepare('INSERT INTO user_tb_log (id, userid, phone, address, action, purpose, comment, nextAction, nextPurpose, reminderDays, reminderdate, createdon, updatedon) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
      stmt2.run(lastInsertedId, user.userid, user.phone, user.address, user.action, user.purpose, user.comment, user.nextAction, user.nextPurpose, user.reminderDays, date2, date1, date1, function (err) {
        if (err) {
          reject(err);
          console.error(err);
        } else {
          resolve('User registered and logged into logdb successfully');
          console.log("User registered and logged into logdb successfully");
        }
        stmt2.finalize();
      });
    });
  });
};



module.exports = { createUser };
