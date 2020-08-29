const userCollection = require('../db').db().collection('users');
const followCollection = require('../db').db().collection('follows');
const ObjectId = require('mongodb').ObjectID;
const User = require('./User');

let Follow = function(FollowedUser,authorId){
    this.FollowedUser = FollowedUser;
    this.authorId = authorId;
    this.errors = [];
}

Follow.prototype.cleanUp = function(){
    if(typeof(this.FollowedUser)!='string'){this.FollowedUser="";}
}

Follow.prototype.validate =async function(action){
    let followedAccount =await userCollection.findOne({username: this.FollowedUser});

    if(followedAccount){
        this.followedId = followedAccount._id;
    }else{
        this.errors.push("You can not follow a user that does not exist.")
    }

    let doesFollowExist = await followCollection.findOne({followedId: this.followedId, authorId: new ObjectId(this.authorId)});

    if(action=='create' && doesFollowExist){
        this.errors.push('You can not followed a person whom you already followed')
    }

    if(action=='create' && this.followedId.equals(this.authorId)){
        this.errors.push('you can not follow youself!!!')
    }

    if(action=='delete' && !doesFollowExist){
        this.errors.push('You can not stop following a person whom you do not follow.')
    }

}

Follow.prototype.create = function(){
    return new Promise(async(resolve,reject)=>{
        this.cleanUp();
        await this.validate('create');

        if(!this.errors.length){
            await followCollection.insertOne({followedId: this.followedId,authorId: new ObjectId(this.authorId)});
            resolve();
        }else{
            reject(this.errors);
        }
    })
}

Follow.prototype.delete = function(){
    return new Promise(async(resolve,reject)=>{
        this.cleanUp();
        await this.validate('delete');

        if(!this.errors.length){
            await followCollection.deleteOne({followedId: this.followedId,authorId: new ObjectId(this.authorId)});

            resolve();
        }else{
            reject(this.errors);
        }
    })
}

Follow.isFollowingProfile =async function(followedId, authorId){
    let user =await followCollection.findOne({followedId: followedId, authorId: new ObjectId(authorId)});

    return user?true:false;
}

Follow.getFollowerById = function(id){
    return new Promise(async(resolve,reject)=>{
        try{
            let followers = await followCollection.aggregate([
                {$match: {followedId: id}},
                {$lookup: {from:'users', localField: "authorId", foreignField:"_id", as:"userDoc"}},
                {$project:{
                    username: {$arrayElemAt: ["$userDoc.username",0]},
                    email: {$arrayElemAt: ["$userDoc.email",0]}
                }}
            ]).toArray();
    
            followers = followers.map(function(follower){
                let user = new User(follower,true);
                return {username: follower.username,avatar: user.avatar};
            });
    
            resolve(followers);
        }catch{
            reject();
        }
    })
}

Follow.getFollowingById = function(id){
    console.log('here');
    return new Promise(async(resolve,reject)=>{
        try{
            let following = await followCollection.aggregate([
                {$match: {authorId: id}},
                {$lookup: {from: 'users', localField: "followedId", foreignField:"_id", as:"userDoc"}},
                {$project: {
                    username: {$arrayElemAt:["$userDoc.username",0]},
                    email: {$arrayElemAt: ['$userDoc.email', 0]}
                }}
            ]).toArray();
    
            following = following.map(function(following){
                let user = new User(following,true);
                return {username: following.username,avatar: user.avatar};
            })
            resolve(following);
        }catch{
            reject();
        }
    })
}

Follow.getFollowerCountById = function(id){
    return new Promise(async(resolve,reject)=>{
        let followerCount = await followCollection.countDocuments({followedId: id});
        resolve(followerCount);
    })
}

Follow.getFollowingCountById = function(id){
    return new Promise(async(resolve,reject)=>{
        let followingCount = await followCollection.countDocuments({authorId: id});
        resolve(followingCount);
    })
}

module.exports = Follow;