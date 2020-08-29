const bcrypt = require('bcryptjs');

const userCollection = require('../db').db().collection('users');
let validator = require('validator');

const md5= require('md5');
const { response } = require('express');

let User = function(data,getAvatar=false){
    this.data =data;
    this.errors=[];
    if(getAvatar) {this.getAvatar()}
}

User.prototype.cleanUp = function(){
    if(typeof(this.data.username)!='string'){this.data.username=""}
    if(typeof(this.data.email)!='string'){this.data.email=""}
    if(typeof(this.data.password)!='string'){this.data.password=""}

    this.data={
        username:this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function(){
    return new Promise(async (resolve,reject) =>{
        if(this.data.username==""){this.errors.push("Enter valid email address.")}
        if(this.data.username!="" && !validator.isAlphanumeric(this.data.username)){this.errors.push("UserName can contains only letter and number")}
        if(this.data.username.length<=3) {this.errors.push("Set username atleast 4 characters")}
        if(this.data.username.length>30) {this.errors.push("Length of Username should be within 30 characters")}
        if(this.data.password==""){this.errors.push("Enter valid password")}
        if(this.data.password.length<=3){this.errors.push("Password must be at least 4 characters")}
        
        if(this.data.email==""){this.errors.push("Enter valid email address")}
        if(!validator.isEmail(this.data.email)){this.errors.push("You must provide email address")}
    
        //if username is valid then check it is already taken or not
        if(this.data.username.length>3 && this.data.username.length<=30 && validator.isAlphanumeric(this.data.username)){
            let usernameExists = await userCollection.findOne({username: this.data.username});
            if(usernameExists){
                this.errors.push("This username has already been taken");
            }
        }
    
        //if email is valid then check it is already taken or not
    
        if(validator.isEmail(this.data.email)){
            let emailExists = await userCollection.findOne({email: this.data.email});
            if(emailExists){
                this.errors.push("This email has already been using");
            }
        }
        resolve();
    })
}

User.prototype.login = function(callback){
    return new Promise((resolve,reject)=>{
        this.cleanUp();
        userCollection.findOne({username: this.data.username}).then((attemtedUser)=>{
            if(attemtedUser && bcrypt.compareSync(this.data.password,attemtedUser.password)){
                this.data=attemtedUser;
                this.getAvatar();
                resolve("Congrats");
            }else{
                reject("invalid user/password");
            }
        }).catch(function(){
            reject("Please try again later.")
        });
    })
}

User.prototype.register = function(){
    return new Promise(async (resolve,reject)=>{
        this.cleanUp();
        await this.validate();
    
        if(!this.errors.length){
            let salt = bcrypt.genSaltSync(10);
            this.data.password = bcrypt.hashSync(this.data.password,salt);
            await userCollection.insertOne(this.data);
            this.getAvatar();
            resolve();
        }else{
            reject(this.errors);
        }
    })
}

User.prototype.getAvatar = function(){
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

User.findUserByName = function(username){
    return new Promise(function(resolve,reject){
        if(typeof(username)!='string'){
            reject();
        }

        userCollection.findOne({username: username}).then(function(userDoc){
            if(userDoc){
                userDoc={
                    _id: userDoc._id,
                    username: userDoc.username,
                    avatar: new User(userDoc,true).avatar
                }
                resolve(userDoc);
            }else{
                reject();
            }
        }).catch(function(){
            reject();
        });
    })
}

User.doesEmailExist = function(email){
    return new Promise(async(resolve,reject)=>{
        if(typeof(email)!='string'){
            resolve(false);
            return;
        }

        let user = await userCollection.findOne({email: email});
        
        if(user){
            resolve(true);
        }else{
            resolve(false);
        }
    })
}

module.exports =User;