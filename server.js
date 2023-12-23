const express = require('express');
const bodyParser = require('body-parser');
const db = require('./db');  //create tables of database.//means db.js

const userRegistrationController = require('./controllers/userRegistrationController');
const userLoginController = require('./controllers/userLoginController');
const displayUsersController = require('./controllers/displayUsersController');
const userUpdateController = require('./controllers/userUpdateController');



const app = express();
const port = 3001;

app.use(bodyParser.json());

app.use(express.static('public'));


//
app.use('/api/user-registration', userRegistrationController);
app.use('/api/user-login', userLoginController);
app.use('/api/display-users', displayUsersController);   //also update
app.use('/api/delete-users', displayUsersController);
//app.use('/api/display-users', displayUsersController);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
