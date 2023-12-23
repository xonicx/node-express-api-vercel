const express = require('express');
const router = express.Router();
const userUpdateonModel = require('../models/updateUserModel');

router.post('/update', async (req, res) => {
  const user= req.body;
 
  try {
    console.log('Received User update request:', user);
    await userUpdateonModel.updateUser(user);
    res.send('User updated successfully');
  } catch (error) {
    console.error('Error in update user:', error);
    res.status(500).send('Error updating user');
  }
});

module.exports = router;
