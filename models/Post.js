const postCollection = require('../db').db().collection('posts');
const followCollection = require('../db').db().collection('follows');
const ObjectId = require('mongodb').ObjectID;
const User = require('./User');
const sanitizeHTML = require('sanitize-html');

let Post = function(data,userId,requestedId){
    this.data=data;
    this.errors=[];
    this.userId=userId;
    this.requestedId = requestedId;
}

Post.prototype.cleanUp = function(){
    if(typeof(this.data.title)!='string') this.data.title="";
    if(typeof(this.data.body)!='string') this.data.body ="";

    //get rid of bogud content
    this.data={
        title: sanitizeHTML(this.data.title.trim(),{allowedTags:[],allowedAttributes:{}}),
        body: sanitizeHTML(this.data.body.trim(),{allowedTags:[],allowedAttributes:{}}),
        createData: new Date(),
        author: ObjectId(this.userId)
    }
}

Post.prototype.validate = function(){
    if(this.data.title=="") this.errors.push("Title field can not be empty");
    if(this.data.body=="") this.errors.push("Content field can not be empty");
}

Post.prototype.create= function(){
    return new Promise((resolve,reject)=>{
        this.cleanUp();
        this.validate();

        if(!this.errors.length){
            postCollection.insertOne(this.data).then((info)=>{
                resolve(info.ops[0]._id);
            }).catch(()=>{
                this.errors.push("Please try again later");
            })
        }else{
            reject(this.errors);
        }
    })
}

Post.prototype.update=function(){
    return new Promise(async(resolve,reject)=>{
        try{
            let post = await Post.findSingleById(this.requestedId,this.userId);
            if(post.isVisitor){
                let status= await this.actualUpdate();
                resolve(status);
            }else{
                reject('You do not have permission to do the task.');
            }
        }catch{
            reject('There is no such post');
        }
    })
}

Post.prototype.actualUpdate = function(){
    return new Promise(async(resolve,reject)=>{
        this.cleanUp();
        this.validate();

        if(!this.errors.length){
            await postCollection.findOneAndUpdate({_id: new ObjectId(this.requestedId)},{$set: {title: this.data.title,body: this.data.body}});
            resolve('success');
        }else{
            reject('failure');
        }
    })
}

Post.reusablePostQuery = function(uniqueQuery,visitorId){
    return new Promise(async function(resolve,reject){
        let aggOperation = uniqueQuery.concat([
            {$lookup: {from:"users",localField:"author",foreignField:"_id",as:"authorDocument"}},
            {$project:{
                title:1,
                body:1,
                createData:1,
                authorId: "$author",
                author: {$arrayElemAt:["$authorDocument",0]}
            }} 
        ]);

        let posts =await postCollection.aggregate(aggOperation).toArray();

        posts = posts.map(function(post){
            post.isVisitor = post.authorId.equals(visitorId);
            post.author={
                username: post.author.username,
                avatar: new User(post.author,true).avatar
            }

            return post;
        })

        resolve(posts);
    })
}


Post.findSingleById = function(id,visitorId){
    return new Promise(async function(resolve,reject){
        if(typeof(id)!='string' || !ObjectId.isValid(id)){
            reject();
            return;
        }

        let posts = await Post.reusablePostQuery([
            {$match: {_id: new ObjectId(id)}}
        ],visitorId)
        
        if(posts.length){
            resolve(posts[0]);
        }else{
            reject();
        }
    })
}

Post.findPostById = function(authorId){
    return Post.reusablePostQuery([
        {$match: {author: authorId}},
        {$sort: {createData: -1}}
    ])
}

Post.delete = function(postId,visitorId)
{
    return new Promise(async(resolve,reject)=>{
        try{
            let post = await Post.findSingleById(postId,visitorId);
            if(post.isVisitor){
                await postCollection.deleteOne({_id: new ObjectId(postId)});
                resolve();
            }else{
                reject();
            }
            
        }catch{
            reject();
        }

    })
}

Post.search = function(searchTerm){
    return new Promise(async(resolve,reject)=>{
        if(typeof(searchTerm)=="string"){
            let posts= await Post.reusablePostQuery([
                {$match: {$text: {$search: searchTerm}}},
                {$sort: {score: {$meta:"textScore"}}}
            ])
            resolve(posts);
        }else{
            reject();
        }
    })
}

Post.getPostCountByAuthor = function(id){
    return new Promise(async(resolve,reject)=>{
        let postCount = await postCollection.countDocuments({author: id});
        resolve(postCount);
    })
}

Post.getFeed = function(id){
    return new Promise(async(resolve,reject)=>{

        //Find Followed user Id
        let following = await followCollection.find({authorId: new ObjectId(id)}).toArray();
        
        following = following.map(function(followDoc){
            return followDoc.followedId;
        })

        //Find Post by followed user
        let posts = await Post.reusablePostQuery([
            {$match: {author: {$in: following}}},
            {$sort: {createData: -1}}
        ]);

        resolve(posts);
    })
}


module.exports = Post;