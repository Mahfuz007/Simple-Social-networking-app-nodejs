//Pick up express
const express = require('express');
const app =express();
const session = require('express-session');
const MongoStore = require('connect-mongo')(session)
const markDown = require('marked');
const flash = require('connect-flash');
const csrf = require('csurf');


let sessionOption = session({
    secret: "JavaScript is soo cool",
    store: new MongoStore({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    cookie: {maxAge: 1000*60*60*24, httpOnly: true}
})

app.use(express.urlencoded({extended: false}));
app.use(express.json());

app.use(sessionOption);
app.use(flash());

app.use(function(req,res,next){
    //make markdown function available within ejs template
    res.locals.filterUserHTML = function(content){
        return markDown(content);
    }

    //make flash message available to all template
    res.locals.errors=req.flash('errors');
    res.locals.success=req.flash('success');

    //Make current userId available on the request object
    if(req.session.user){
        req.visitorId = req.session.user._id;
    }else req.visitorId=0;

    //make session data available for view template
    res.locals.user= req.session.user;
    next();
})

const router =require('./router');

app.set('views','views'); //Configure views folder
app.set('view engine','ejs'); // configure view engine
app.use(express.static('public')); //include separate folder

app.use(csrf());
app.use(function(req,res,next){
    res.locals.csrfToken = req.csrfToken();
    next(); 
})

app.use('/',router);

app.use(function(err,req,res,next){
    if(err){
        if(err.code=="EBADCSRFTOKEN"){
            req.flash("errors","Cross site request forgery detected");
            req.session.save(()=> res.redirect('/'));
        }else{
            res.render("404");
        }
    }
})


const server = require('http').createServer(app);
const io = require('socket.io')(server);

io.on('connection',function(socket){
    socket.on('chatMessageFromBrowser',function(data){
        console.log(data.message);
    })
})

module.exports = server;