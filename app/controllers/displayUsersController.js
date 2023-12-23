const express = require('express');
const router = express.Router();
const displayUsersModel = require('../models/displayUsersModel');

router.get('/users', async (req, res) => {
  try {
    console.log('inside display user controller');
    const users = await displayUsersModel.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).send('Error fetching users');
  }
});

router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const user = req.body;

  try {
    await displayUsersModel.updateUser(user);
    res.send('User updated successfully');
  } catch (error) {
    res.status(500).send('Error updating user');
  }
});

router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;
  const { userid, phone } = req.body;
  console.log('inside delete controller');
  try {
    await displayUsersModel.deleteUser(id);
    res.send('User deleted successfully');
  } catch (error) {
    res.status(500).send('Error deleting user');
  }
});



router.post('/search/:key', async (req, res) => {
  try {
    console.log('inside search controller');
    const { key } = req.params;
    const user = req.body;
    let users = [];
    
    if(key =='all') {
      console.log("key:",key);
      users = await displayUsersModel.searchUserAll();
    } else if(key =='userid') {
      console.log("key:",key);
       users = await displayUsersModel.searchByUserId(user.userid);
    }else if(key =='phone') {
      console.log("key:",key);
       users = await displayUsersModel.searchByPhone(user.phone);
    }else if(key =='todaytask') {
      console.log("key:",key);
       users = await displayUsersModel.searchTodaysTask();
    } else if(key =='userlog') {
      console.log("key:",key);
       users = await displayUsersModel.searchLogById(user.id);
    } 
    
    
  
    console.log("user.userid:",user.userid);
    console.log("user.phone:",user.phone);
  
    console.log('searched users found:');
    console.log(users);
    res.json(users);
  } catch (error) {
    res.status(500).send('Error searching users');
  }
});

module.exports = router;
