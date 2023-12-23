const express = require('express');
const router = express.Router();
const userLoginModel = require('../models/userLoginModel');

router.post('/login', async (req, res) => {
  const { userid, phone } = req.body;

  try {
    const user = await userLoginModel.getUserByCredentials(userid, phone);
    console.log('Received Login request:', { userid, phone });
    if (user) {
      res.send('Login successful');
    } else {
      res.status(401).send('Invalid credentials');
    }
  } catch (error) {
    res.status(500).send('Error during login');
  }
});

module.exports = router;