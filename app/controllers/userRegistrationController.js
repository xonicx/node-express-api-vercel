const express = require('express');
const router = express.Router();
const userRegistrationModel = require('../models/userRegistrationModel');

router.post('/register', async (req, res) => {
  const user = req.body;
 
  try {
    console.log('Received registration request:', user);
    await userRegistrationModel.createUser(user);
    res.send('User registered successfully');
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Error registering user');
  }
});

module.exports = router;
