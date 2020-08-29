const Post = require('../models/Post');

exports.createPost = function(req,res){
    res.render('create-post');
}

exports.create = function(req,res){
    let post = new Post(req.body,req.session.user._id);
    post.create().then((id)=>{
        req.flash("success","Post successfully created.");
        req.session.save(function(){
            res.redirect(`/post/${id}`);
        })
    }).catch((errors)=>{
        errors.forEach(err=>req.flash('errors',err));
        req.session.save(function(){
            res.redirect('/create-post');
        })
    });
}

exports.viewSingle =async function(req,res){
    try{
        let post =await Post.findSingleById(req.params.id,req.visitorId);
        res.render('single-post-view',{post: post});
    }catch{
        res.render('404');
    }
}

exports.editPostScreen =async function(req,res){
    try{
        let post = await Post.findSingleById(req.params.id,req.visitorId);
        res.render('edit-post',{post:post});
    }catch{
        res.render('404');
    }
}

exports.edit= function(req,res){
    let post = new Post(req.body,req.visitorId,req.params.id);
    post.update().then(status=>{
        if(status=='success'){
            req.flash('success','Post has been updated');
            req.session.save(()=>{
                res.redirect(`/post/${req.params.id}`);
            })
        }else{
            errors.forEach(err => {
                req.flash('errors',err);
            });
            
            req.session.save(()=>{
                res.redirect(`/post/${req.params.id}`)
            })
        }
    }).catch(function(){
        req.flash('errors','You do not have permission to perform the task')
        req.session.save(()=>{
            res.redirect("/")
        })
    });
}

exports.delete =async function(req,res){
    Post.delete(req.params.id,req.visitorId).then(()=>{
        req.flash('success','Post successfully deleted');
        req.session.save(()=>{
            res.redirect(`/profile/${req.session.user.username}`);
        })
    }).catch(()=>{
        req.flash('errors','You dont have permission to perform the task');
        req.session.save(()=>res.redirect('/'));
    });
}


exports.search = function(req,res){
    Post.search(req.body.searchTerm).then(posts=>{
        res.json(posts);
    }).catch(()=>{
        res.json([]);
    });
}

