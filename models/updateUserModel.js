const db = require('../db');

function formatSQLiteDatetime(jsDatetime) {
  const day = String(jsDatetime.getDate()).padStart(2, '0');
  const month = String(jsDatetime.getMonth() + 1).padStart(2, '0');
  const year = jsDatetime.getFullYear();
  const hours = String(jsDatetime.getHours()).padStart(2, '0');
  const minutes = String(jsDatetime.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}


const updateUser = (user) => {

  console.log("update user called");

  const jsDatetime = new Date(); // Replace this with your JavaScript datetime object

  const date1 = formatSQLiteDatetime(jsDatetime);
  console.log("converted date: ", date1);

  return new Promise((resolve, reject) => {



    const stmt = db.prepare('UPDATE user_tb SET userid = ?,phone = ?,address = ?,action = ?,purpose = ?,comment = ?,nextAction = ?,nextPurpose = ?,reminderDays = ?,updatedon = ? WHERE id = ?');
    stmt.run(user.userid, user.phone, user.address, user.action, user.purpose, user.comment, user.nextAction, user.nextPurpose, user.reminderDays, date1, user.id, (err) => {
      if (err) {
        reject(err);
        console.log(err);
      } else {
        resolve('User updated successfully');
      }
      stmt.finalize();
    });
  });
};

module.exports = { updateUser };
