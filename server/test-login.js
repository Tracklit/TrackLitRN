// Quick test to create authenticated session
const express = require('express');
const session = require('express-session');

// Create test login endpoint
const testLogin = async (req, res) => {
  // Manually set session for user Ricardopatrese400
  req.session.user = {
    id: 36,
    username: 'Ricardopatrese400',
    role: 'athlete'
  };
  
  await new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  
  res.json({ success: true, message: 'Test login successful', user: req.session.user });
};

module.exports = { testLogin };