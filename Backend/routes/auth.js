const express = require('express');
const User = require('../models/User')
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { json } = require('express');
const bcrypt = require('bcryptjs')
var jwt = require('jsonwebtoken');
const JWT_SECRET = "vishnuisgoodboy"
var fetchuser = require("../middleware/fetchuser");



// Route-1 Create a user using: POST "/api/auth/createuser". Doesn't require Auth
router.post('/createuser', [
   body('name', 'Enter a valid name').isLength({ min: 3 }),
   body('email', 'Enter a valid email').isEmail(),
   body('password', 'Password must be atleast 5 characters ').isLength({ min: 5 }),
], async (req, res) => {
   let success = false;

   // If there are errors, return Bad request and the errors
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400), json({success, errors: errors.array() });
   }

   //   check whether the user with this email exists already
   try {

      let user = await User.findOne({ email: req.body.email });
      if (user) {
         return res.status(400).json({success, error: "Sorry a user with email already exists" })
      }

      // creating hash for our password 

      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt)

      // create a new user form validation

      user = await User.create({
         name: req.body.name,
         password: secPass,
         email: req.body.email,
      })
      //   jwt method return tocken for user
      const data = {
         user: {
            id: user.id
         }
      }

      const authtoken = jwt.sign(data, JWT_SECRET);
      // console.log(authtoken);
      success = true;
      res.json({success, authtoken })

      // catch error
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
   }

   //   .then(user => res.json(user))
   //   .catch(err => {console.log(err)
   //    res.json({error: 'please enter a unique value for email'})});

})


// Authenticate a user using : Post "/api/auth/login", No login require
// Route - 2 for login
router.post('/login', [
   body('email', 'Enter a valid email').isEmail(),
   body('password', 'Password can not be blank ').exists(),
], async (req, res) => {

   let success = false;
   const errors = validationResult(req);
   if (!errors.isEmpty()) {
      return res.status(400), json({ errors: errors.array() });
   }

   const { email, password } = req.body;
   try {
      let user = await User.findOne({ email });
      if (!user) {
         success = false;
         return res.status(400).json({ error: "Please try to login with correct information" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
         success = false;
         return res.status(400).json({ success,error: "Please try to login with correct information" });
      }
      const data = {
         user: {
            id: user.id
         }
      }

      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      // console.log(authtoken);
      res.json({ success,authtoken })
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
   }

})


// Route-3 get login user details using POST "/api/auth/getuser", Login require
router.post('/getuser', fetchuser, async (req, res) => {

   try {
      userId = req.user.id;
      const user = await User.findById(userId).select("-password");
      res.send(user);
   } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
   }
})
module.exports = router