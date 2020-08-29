const express = require('express');
const router =express.Router();
const userController = require('./controllers/userController');
const postController = require('./controllers/postController');
const followController = require('./controllers/followController');

// User's Routes
router.get('/',userController.home);
router.post('/register',userController.register);
router.post('/login',userController.login);
router.post('/logout',userController.logout);
router.post('/doesUserExist',userController.doesUserExist);
router.post('/doesEmailExist',userController.doesEmailExist);

//profile related routes
router.get('/profile/:username',userController.ifUserExists,userController.sharedProfile,userController.profilePostScreen);
router.get('/profile/:username/followers',userController.ifUserExists,userController.sharedProfile,userController.profileFollowerScreen);
router.get('/profile/:username/following',userController.ifUserExists,userController.sharedProfile,userController.profileFollowingScreen);


//Post Routes
router.get('/create-post',userController.userLoggedIn,postController.createPost);
router.post('/create-post',userController.userLoggedIn,postController.create);
router.get('/post/:id',postController.viewSingle);
router.get('/post/:id/edit',userController.userLoggedIn,postController.editPostScreen);
router.post('/post/:id/edit',userController.userLoggedIn,postController.edit);
router.post('/post/:id/delete',userController.userLoggedIn,postController.delete);
router.post('/search',postController.search);

//Follow related routes
router.post('/addfollow/:user',userController.userLoggedIn,followController.addFollower);
router.post('/removefollow/:user',userController.userLoggedIn,followController.removeFollower);


module.exports  = router;