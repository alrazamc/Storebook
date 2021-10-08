const router = require('express').Router();
const User = require('../models/system/User');
const Store = require('../models/store/Store');
const bcrypt = require('bcryptjs');
const { createAuthUser, createJwtToken } = require('../utils');
const moment = require('moment-timezone');
const { authCheck } = require('../utils/middlewares');
const { storeStates } = require('../utils/constants');

router.post('/signup', async (req, res) => {
  try
  {
    if(!req.body.name) throw new Error("Name is required");
    if(!req.body.phone) throw new Error("Mobile number is required");

    let user = await User.findOne({ phone: req.body.phone });
    if(user !== null && user.status > -1)
      throw new Error("this mobile number is already registered. Please use a different number");

    if(user === null)
    {
      user = await new User({
          name: req.body.name,
          phone: req.body.phone,
          status: -1
        }).save();
    }

    if(!req.body.pin) //step 1 generate verification pin
    {
      const pin = Math.floor(100000 + Math.random() * 900000);
      console.log("Pin is "+pin);
      user.set("verificationPin", await bcrypt.hash(''+pin, 10));
      await user.save();
    }else if(!(await bcrypt.compare(req.body.pin, user.verificationPin)) ) //step#2 verify pin
    {
      throw new Error("Invalid code");
    }else if(req.body.password)
    {
      user.set("name", req.body.name);
      user.set("password", await bcrypt.hash(req.body.password, 10) );
      user.set("verificationPin", "");
      user.set("status", 1);
      user.set("isNumberVerified", 1);
      user.set("language", req.body.language ? req.body.language : 'english');
      const currentTime = moment().tz('Asia/Karachi').toDate();
      user.set("lastVisited", currentTime);
      user.set("lastUpdated", currentTime);
      user.set("createdOn", currentTime);
      await user.save();
      let userObj = user.toObject();
      const response = {
        user: createAuthUser(userObj),
        token: await createJwtToken(userObj)
      }
      res.json(response);
      return;
    }
    res.json({success: true});
  }catch(err)
  {
    res.status(400).json({message: err.message})
  }
});

router.post('/signin', async (req, res) => {
  try
  {
    if(!req.body.phone) throw new Error("Mobile number is required");
    if(!req.body.password) throw new Error("Password is required");

    const user = await User.findOne({ phone: req.body.phone });
    if(user === null || !(await bcrypt.compare(req.body.password, user.password)) )
      throw new Error("Invalid mobile number or password");
    await user.updateLastVisited();
    
    const userObj = user.toObject();
    if( userObj.status < 1)
      throw new Error("Account is disabled. Please contact support");
    const stores = await Store.find({ 'users.userId': userObj._id, status: storeStates.STORE_STATUS_ACTIVE }).populate('users.record', 'name phone profilePicture');
    res.json({
      user: createAuthUser(userObj),
      token: await createJwtToken(userObj),
      stores
    });
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.post('/resetPassword', async (req, res) => {
  try
  {
    if(!req.body.phone) throw new Error("Mobile number is required");
    
    let user = null;
    user = await User.findOne({ phone: req.body.phone });
    if(user === null || user.status === -1)
      throw new Error("Not registered, Please create new account");
    else if(user.status === 0)
      throw new Error("Account is disabled");
    
    if(!req.body.pin) //step 1 generate verification pin
    {
      const pin = Math.floor(100000 + Math.random() * 900000);
      console.log("Pin is "+pin);
      user.set("verificationPin", await bcrypt.hash(""+pin, 10));
      await user.save();
    }else if(!(await bcrypt.compare(''+req.body.pin, user.verificationPin)) ) //step#2 verify pin
    {
      throw new Error("Invalid code");
    }else if(req.body.password) //step#3 pin verified, now set password
    {
      user.set('password', await bcrypt.hash(req.body.password, 10) );
      user.set("verificationPin", '');
      await user.save();
    }
    res.send({success: true});
  }catch(err)
  {
    return res.status(400).json({message: err.message});
  }
});

router.use(['/profile', '/validate', '/settings'], authCheck);

router.get('/profile', async (req, res) => {
    try
    {
      res.json({
        user: req.user,
        systemVersion: process.env.SYSTEM_VERSION
      });
    }catch(err)
    {
      res.json({message: err.message});
    }
});

//use for async validation on signup or account settings
router.post('/validate', async (req, res) => {
  try
  {
    const exists = {
      phone: false
    }
    if(req.body.phone)
    {
      let users = await User.find({ phone: req.body.phone, _id: {$ne: req.user._id} });
      if(users && users.length)
        exists.phone = "This number is already registered. Please use a different number";
    }
    res.json(exists);
  }catch(err)
  {
    res.status(400).json({message: err.message});
  }
});

router.post('/settings', async (req, res) => {
  try
  {
    const result = await User.findOne({_id: req.user._id});
    if(result === null)
      throw new Error("Invalid Request");
    if(req.user.newPassword)
    {
      if(!req.body.currentPassword)
        throw new Error('Current password is required');
      if( !( await bcrypt.compare(req.body.currentPassword, result.password)) )
        throw new Error('Current password is invalid');
    }
    const data = {
      name : req.body.name
    };
    if(req.body.newPassword)
      data.password = await bcrypt.hash(req.body.newPassword, 10);
    await User.updateOne({_id: req.user._id }, data, {runValidators: true});
    const user = await User.findOne({_id: req.user._id });
    res.json( createAuthUser(user.toObject()) );
  }catch(err)
  {
    res.status(400).json({message: err.message});
  }
});

module.exports = router;
