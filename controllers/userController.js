const User =require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');

exports.doesEmailExist = async function(req,res){
    let email = await User.doesEmailExist(req.body.email);
    res.json(email);
}

exports.doesUserExist = async function(req,res){
    User.findUserByName(req.body.username).then(()=>{
        res.json(true);
    }).catch(()=>{
        res.json(false);
    });
}

exports.sharedProfile = async function(req,res,next){
    let isFollowing = false;
    let isYourself = false;
    
    if(req.session.user){
        isFollowing = await Follow.isFollowingProfile(req.profileUser._id, req.visitorId);
    }

    if(req.profileUser._id.equals(req.session.user._id)) isYourself = true;
    req.isYourself = isYourself;
    req.isFollowing = isFollowing;

    let postCountPromise = Post.getPostCountByAuthor(req.profileUser._id);
    let followerCountPromise = Follow.getFollowerCountById(req.profileUser._id);
    let followingCountPromise = Follow.getFollowingCountById(req.profileUser._id);

    let [postCount,followerCount,followingCount] = await Promise.all([postCountPromise,followerCountPromise,followingCountPromise]);

    req.postCount = postCount;
    req.followerCount = followerCount;
    req.followingCount = followingCount;

    next();
}

exports.userLoggedIn = function(req,res,next){
    if(req.session.user){
        next();
    }else{
        req.flash("errors","You must be logged in to perform the action");
        req.session.save(function(){
            res.redirect('/');
        })
    }
}

exports.login =function(req,res){
    let user = new User(req.body);
    user.login().then(function(result){
        req.session.user = {avatar: user.avatar, username: user.data.username,_id:user.data._id}
        req.session.save(function(){
            res.redirect('/');
        })
    }).catch(function(e){
        req.flash('errors',e);
        req.session.save(function(){
            res.redirect('/');
        })
    });
}

exports.logout = function(req,res){
    req.session.destroy(function(){
        res.redirect('/');
    });
}

exports.register=function(req,res){
    let user = new User(req.body);
    user.register().then(()=>{
        req.session.user={username: user.data.username,avatar: user.avatar,_id: user.data._id};
        req.session.save(function(){
            res.redirect('/');
        })
    }).catch((regErrors)=>{
        regErrors.forEach(function(error){
            req.flash('regErrors',error);
        })
        req.session.save(function(){
            res.redirect('/');
        })
    });
}

exports.home = async function(req,res){
    if(req.session.user){
        let posts =await Post.getFeed(req.session.user._id);
        res.render('home-dashboard',{posts:posts});
    }else{
        res.render('home-guest',{regErrors: req.flash('regErrors')});
    }
}

exports.ifUserExists = function(req,res,next){
    User.findUserByName(req.params.username).then(function(userDoc){
        req.profileUser=userDoc;
        next();
    }).catch(function(){
        res.render('404');
    });
}

exports.profilePostScreen = function(req,res){
    Post.findPostById(req.profileUser._id).then(function(posts){
        res.render('profile',{
            currentPage: 'posts',
            isYourself: req.isYourself,
            isFollowing: req.isFollowing,
            posts:posts,
            user: req.profileUser.username,
            avatar: req.profileUser.avatar,
            counts:{postCount: req.postCount,followerCount: req.followerCount, followingCount: req.followingCount}
        });
    }).catch(function(){
        res.render('404');
    });
}

exports.profileFollowerScreen = async function(req,res){
    try{
        let follower = await Follow.getFollowerById(req.profileUser._id);
        res.render('profile-follower',{
            currentPage: 'followers',
            followers: follower,
            isYourself: req.isYourself,
            isFollowing: req.isFollowing,
            user: req.profileUser.username,
            avatar: req.profileUser.avatar,
            counts:{postCount: req.postCount,followerCount: req.followerCount, followingCount: req.followingCount}
        })
    }catch{
        res.render('404');
    }
}

exports.profileFollowingScreen = async function(req,res){
    try{
        let following = await Follow.getFollowingById(req.profileUser._id);
        res.render('profile-following',{
            currentPage: 'following',
            following: following,
            isYourself: req.isYourself,
            isFollowing: req.isFollowing,
            user: req.profileUser.username,
            avatar: req.profileUser.avatar,
            counts:{postCount: req.postCount,followerCount: req.followerCount, followingCount: req.followingCount}
        });

    }catch{
        res.render('404');
    }
}