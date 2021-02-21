const express = require('express');
const router = express.Router();
const cors = require('cors');

router.get('/', cors(), (req, res) => {
  res.send('server up');
});

module.exports = router;
