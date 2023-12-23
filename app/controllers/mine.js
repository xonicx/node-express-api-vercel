
const createUser = (user) => {

    console.log("create user called");

  return new Promise((resolve, reject) => {

    //const jsDatetime = new Date(); // Replace this with your JavaScript datetime object
    let jsDateforreminder = new Date();
    console.log("user.reminderDays: ",user.reminderDays);
    jsDateforreminder.setDate(  jsDateforreminder.getDate() + parseInt(user.reminderDays ));
 
    const date1 = formatSQLiteDatetime(new Date());
    const date2 = formatSQLiteDatetime(jsDateforreminder);
    console.log("converted date: ",date1);
    console.log("converted reminder date: ",date2);
    let lastInsertedId = '' ;

    const stmt = db.prepare('INSERT INTO user_tb (userid, phone,address,action,purpose,comment,nextAction,nextPurpose,reminderDays,reminderdate,createdon,updatedon) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
    stmt.run(user.userid, user.phone, user.address, user.action, user.purpose, user.comment, user.nextAction, user.nextPurpose, user.reminderDays,date2 ,date1, date1, (err) => {
      if (err) {
        reject(err);
        console.log(err);
      } else {
        resolve('User registered successfully');
        console.log("User registered successfully");
      }
       lastInsertedId = this.lastID;
       console.log("lastInsertedId = ",this.lastID);
      stmt.finalize();
    });

    
    //create log:
    const stmt2 = db.prepare('INSERT INTO user_tb_log (id,userid, phone,address,action,purpose,comment,nextAction,nextPurpose,reminderDays,reminderdate,createdon,updatedon) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');
    stmt2.run(lastInsertedId,user.userid, user.phone, user.address, user.action, user.purpose, user.comment, user.nextAction, user.nextPurpose, user.reminderDays,date2 ,date1, date1, (err) => {
      if (err) {
        reject(err);
        console.log(err);
      } else {
        resolve('User logged into logdb successfully');
        console.log("User logged into logdb successfully");
      }
      stmt2.finalize();
    });
  });
};