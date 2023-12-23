const db = require('../db');


function formatSQLiteDatetime(jsDatetime) {
  const day = String(jsDatetime.getDate()).padStart(2, '0');
  const month = String(jsDatetime.getMonth() + 1).padStart(2, '0');
  const year = jsDatetime.getFullYear();
  const hours = String(jsDatetime.getHours()).padStart(2, '0');
  const minutes = String(jsDatetime.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year}, ${hours}:${minutes}`;
}


const getAllUsers = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM user_tb', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const updateUser = (user) => {

  console.log("update user called");

  let jsDateforreminder = new Date();
  console.log("user.reminderDays: ",user.reminderDays);
  jsDateforreminder.setDate(  jsDateforreminder.getDate() + parseInt(user.reminderDays ));

  const jsDatetime = new Date(); // Replace this with your JavaScript datetime object

  const date1 = formatSQLiteDatetime(jsDatetime);
  const date2 = formatSQLiteDatetime(jsDateforreminder);
  console.log("update request recieved",user);

  return new Promise((resolve, reject) => {
    
    const stmt = db.prepare('UPDATE user_tb SET userid = ?,phone = ?,address = ?,action = ?,purpose = ?,comment = ?,nextAction = ?,nextPurpose = ?,reminderDays = ?,reminderdate = ?,updatedon = ? WHERE id = ?');
    stmt.run(user.userid, user.phone, user.address, user.action, user.purpose, user.comment, user.nextAction, user.nextPurpose, user.reminderDays, date2,date1, user.id, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve('User updated successfully');
      }
      stmt.finalize();
    });

    const stmt2 = db.prepare('INSERT INTO user_tb_log (id,userid, phone,address,action,purpose,comment,nextAction,nextPurpose,reminderDays,reminderdate,createdon,updatedon) VALUES (?, ?, ?,?,?,?,?,?,?,?,?,?,?)');
    stmt2.run(user.id, user.userid, user.phone, user.address, user.action, user.purpose, user.comment, user.nextAction, user.nextPurpose, user.reminderDays,date2,'', date1, (err) => {

   // const stmt2 = db.prepare('UPDATE user_tb SET userid = ?,phone = ?,address = ?,action = ?,purpose = ?,comment = ?,nextAction = ?,nextPurpose = ?,reminderDays = ?,reminderdate = ?,createdon,updatedon = ? WHERE id = ?');
    //stmt.run(user.userid, user.phone, user.address, user.action, user.purpose, user.comment, user.nextAction, user.nextPurpose, user.reminderDays, date2,date1, user.id, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve('User update pushed to log table successfully');
      }
      stmt2.finalize();
    });

  });
};

const deleteUser = (id) => {
  return new Promise((resolve, reject) => {
    console.log("delete request recieved");
    const stmt = db.prepare('DELETE from user_tb WHERE id = ?');
    stmt.run(id, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve('User deleted successfully');
      }
      stmt.finalize();
    });
  });
};

const searchByUserId = (userid) => {
  userid = '%'+ userid +'%';
  console.log("search by userid request recieved");
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('SELECT * FROM user_tb WHERE userid LIKE ?');
   
    stmt.all(`${userid}`, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row); // If a match is found, it will resolve with the row data
      }
      stmt.finalize();
    });
  });
};

const searchLogById = (id) => {
  
  //console.log('searchLogByUserid',userid);
  console.log("Trace by ID request recieved", id);
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('SELECT * FROM user_tb_log WHERE id = ?');
   
    stmt.all(id, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row); // If a match is found, it will resolve with the row data
      }
      stmt.finalize();
    });
  });
};




const searchByPhone = (phone) => {
  phone = '%'+ phone +'%';
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('SELECT * FROM user_tb WHERE phone LIKE ?');
   
    stmt.all(`%${phone}%`, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row); // If a match is found, it will resolve with the row data
      }
      stmt.finalize();
    });
  });
};

const searchTodaysTask = () => {
  return new Promise((resolve, reject) => {
    try {
      let dpush3 = new Date();
      dpush3.setDate(dpush3.getDate() + 3);
      let dmin3 = new Date();
      dmin3.setDate(dmin3.getDate() - 3);

      const plushdate = formatSQLiteDatetime(dpush3);
      const mindate = formatSQLiteDatetime(dmin3);

      // Construct the SQL string with placeholders
      const sql = 'SELECT * FROM user_tb WHERE ((reminderdate > $mindate) AND (reminderdate < $plushdate))';

      const stmt = db.prepare(sql);

      // Log the statement string with parameter values
      console.log('Statement String for searchTodaysTask:', sql, { $mindate: mindate, $plushdate: plushdate });

      stmt.all({ $mindate: mindate, $plushdate: plushdate }, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row); // If a match is found, it will resolve with the row data
        }

        stmt.finalize();
      });
    } catch (error) {
      reject(error);
    }
  });
};





const searchUserAll = () => {
  
  return new Promise((resolve, reject) => {
    const stmt = db.prepare('SELECT * FROM user_tb');
    stmt.all((err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row); // If a match is found, it will resolve with the row data
      }
      stmt.finalize();
    });
  });
};

module.exports = { getAllUsers, updateUser, searchUserAll,searchByPhone, searchByUserId,deleteUser,searchTodaysTask,searchLogById};
