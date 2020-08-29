import axios from 'axios';

export default class RegistrationForm{
    constructor(){
        this._csrf = document.querySelector('[name="_csrf"]').value;
        this.form = document.querySelector('#registration-form');
        this.allFields = document.querySelectorAll("#registration-form .form-control");
        this.insertValidationHtml();
        this.username = document.querySelector('#username-register');
        this.username.previousValue = "";
        this.username.errors = false;
        this.username.unique = false;
        this.email = document.querySelector('#email-register');
        this.email.previousValue = "";
        this.email.errors = false;
        this.email.unique = false;
        this.password = document.querySelector('#password-register');
        this.password.previousValue ="";
        this.password.errors = false;
        this.event();
    }

    //events
    event(){

        this.form.addEventListener('submit',(e)=>{
            e.preventDefault();
            this.formHandler();
        })
        
        this.username.addEventListener('keyup',()=>{
            this.isDifferent(this.username,this.usernameHandler);
        })

        this.email.addEventListener('keyup',()=>{
            this.isDifferent(this.email,this.emailHandler);
        })

        this.password.addEventListener('keyup',()=>{
            this.isDifferent(this.password,this.passwordHandler);
        })

        this.username.addEventListener('blurn',()=>{
            this.isDifferent(this.username,this.usernameHandler);
        })

        this.email.addEventListener('blur',()=>{
            this.isDifferent(this.email,this.emailHandler);
        })

        this.password.addEventListener('blur',()=>{
            this.isDifferent(this.password,this.passwordHandler);
        })
    }

    //methods

    formHandler(){
        this.usernameImmediately();
        this.usernameAfterDelay();
        this.emailAfterDelay();
        this.passwordImmediately();
        this.passwordAfterDelay();

        if(!this.username.errors && !this.email.errors && !this.password.errors && this.username.unique && this.email.unique){
            this.form.submit();
        }
    }

    isDifferent(element,handler){
        if(element.previousValue!=element.value){
            handler.call(this);
        }
        element.previousValue = element.value;
    }

    passwordHandler(){
        this.password.errors = false;
        this.passwordImmediately();
        clearTimeout(this.password.timer);
        this.password.timer = setTimeout(()=>this.passwordAfterDelay(),800);
    }

    passwordImmediately(){
        if(this.password.value.length>30){
            this.showValidationErrors(this.password,"Password can not exceed 50 character");
        }

        if(!this.password.errors){
            this.hideValidationErrors(this.password);
        }
    }

    passwordAfterDelay(){
        console.log(this.password.value.length);
        if(this.password.value.length<6){
            this.showValidationErrors(this.password,"Password must be at least 6 characters");
        }
    }

    emailHandler(){
        this.email.errors=false;
        this.hideValidationErrors(this.email);
        clearTimeout(this.email.timer);
        this.email.timer = setTimeout(()=>this.emailAfterDelay(),800);
    }

    emailAfterDelay(){
        if(!/^\S+@\S+$/.test(this.email.value)){
            this.showValidationErrors(this.email,"Please enter a valid email address");
        }

        if(!this.email.errors){
            axios.post('/doesEmailExist',{_csrf: this._csrf ,email: this.email.value}).then(response=>{
                if(response.data){
                    this.showValidationErrors(this.email,"That email already been used");
                    this.email.unique = false;
                }else{
                    this.hideValidationErrors(this.email);
                    this.email.unique = true;
                }
            }).catch(()=>{
                console.log("Please try again later");
            })
        }

        if(!this.email.errors){
            this.hideValidationErrors(this.email);
        }
    }

    usernameHandler(){
        this.username.errors=false;
        this.usernameImmediately();
        clearTimeout(this.username.timer);
        this.username.timer = setTimeout(()=>this.usernameAfterDelay(),800);
    }

    usernameAfterDelay(){
        if(this.username.value.length<3){
            this.showValidationErrors(this.username,"Username must be at least three characters");
        }

        if(!this.username.errors){
            axios.post('/doesUserExist',{_csrf:this._csrf ,username: this.username.value}).then(response=>{
                if(response.data){
                    this.showValidationErrors(this.username,"That username already taken");
                    this.username.unique = false;
                }else{
                    this.username.unique = true;
                }
            })
        }
    }

    usernameImmediately(){
        if(this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)){
            this.showValidationErrors(this.username,"Username can only contains letters and numbers");
        }

        if(this.username.value.length>30){
            this.showValidationErrors(this.username,"Username length must be less than 30 character");
        }

        if(!this.username.errors){
            this.hideValidationErrors(this.username);
        }
    }

    hideValidationErrors(ele){
        ele.nextElementSibling.classList.remove("liveValidateMessage--visible")
    }

    showValidationErrors(ele,message){
        ele.nextElementSibling.innerHTML = message;
        ele.nextElementSibling.classList.add('liveValidateMessage--visible');
        ele.errors = true;
    }

    insertValidationHtml(){
        this.allFields.forEach(function(ele){
            ele.insertAdjacentHTML('afterend','<div class="alert alert-danger small liveValidateMessage"></div>')
        })
    }
}