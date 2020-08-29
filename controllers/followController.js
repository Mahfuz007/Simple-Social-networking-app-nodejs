let Follow = require('../models/Follow');

exports.addFollower = function(req,res){
    let follow = new Follow(req.params.user,req.visitorId);
    follow.create().then(()=>{
        req.flash('success',`Successfully followed ${req.params.user}`);
        req.session.save(()=>{
            res.redirect(`/profile/${req.params.user}`);
        })
    }).catch(errors=>{
        errors.forEach(err=>{
            req.flash('errors',err);
        })
        req.session.save(()=>{
            res.redirect('/');
        })
    });
}

exports.removeFollower = function(req,res)
{
    let follow = new Follow(req.params.user,req.visitorId);
    follow.delete().then(()=>{
        req.flash('success','Successfully stopped following.');
        req.session.save(()=>{
            res.redirect(`/profile/${req.params.user}`);
        })
    }).catch((errors)=>{
        errors.forEach(err=>{
            req.flash('errors',err);
        })
        req.session.save(()=>{
            res.redirect('/');
        })
    });
}