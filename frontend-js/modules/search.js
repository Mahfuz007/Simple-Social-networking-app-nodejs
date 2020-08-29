import axios from "axios";
import DOMpurify from "dompurify";

export default class Search{
    constructor(){
        this._csrf = document.querySelector('[name="_csrf"]').value;
        this.injectHTML();
        this.headerSearchIcon = document.querySelector('.header-search-icon');
        this.overlay = document.querySelector('.search-overlay');
        this.closIcon = document.querySelector('.close-live-search');
        this.inputField =document.querySelector('#live-search-field');
        this.loaderIcon = document.querySelector(".circle-loader");
        this.resultsArea = document.querySelector('.live-search-results');
        this.typingWaitTime;
        this.previousValue="";
        this.event();
    }

    event(){
        this.inputField.addEventListener("keyup",()=>this.keyPressed());

        this.headerSearchIcon.addEventListener('click',(e)=>{
            e.preventDefault();
            this.openOverlay();
            setTimeout(()=>this.inputField.focus(),50);
        })

        this.closIcon.addEventListener('click',()=>this.closeOverlay());
    }

    keyPressed(){
        let value = this.inputField.value;

        if(value==""){
          clearTimeout(this.typingWaitTime);
          this.hideLoaderIcon();
          this.hideResultsArear();
        }

        if(value!="" && value !=this.previousValue){
            clearTimeout(this.typingWaitTime);
            this.showLoaderIcon();
            this.typingWaitTime= setTimeout(()=>this.sendRequest(),750);
        }

        this.previousValue=value;
    }

    sendRequest(){
        axios.post('/search',{_csrf:this._csrf,searchTerm: this.inputField.value}).then((response)=>{
            console.log(response.data);
            this.renderResultHTML(response.data);
        }).catch(()=>{
            alert('send request failed');
        });
    }

    renderResultHTML(posts){
      if(posts.length){
        this.resultsArea.innerHTML = DOMpurify.sanitize(`<div class="list-group shadow-sm">
        <div class="list-group-item active"><strong>Search Results</strong> (${posts.length>1?`${posts.length} items found`:`1 item found`} )</div>

        ${posts.map((post)=>{
          let postDate=new Date(post.createData);
          return `<a href="/post/${post._id}" class="list-group-item list-group-item-action">
          <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${post.title}</strong>
          <span class="text-muted small">by ${post.author.username} on ${postDate.getDate()}/${postDate.getMonth()+1}/${postDate.getFullYear()}</span>

          
        </a>`
        }).join('')}
        
      </div>`)
      }else{
        this.resultsArea.innerHTML=`<p class="alert alert-danger text-center shadow-sm">Sorry!No resut found.</p>`
      }
      this.hideLoaderIcon();
      this.showResultsArear();
    }

    showResultsArear(){
      this.resultsArea.classList.add('live-search-results--visible');
    }
    
    hideResultsArear(){
      this.resultsArea.classList.remove('live-search-results--visible');
    }
    showLoaderIcon(){
        this.loaderIcon.classList.add('circle-loader--visible');
    }
    hideLoaderIcon(){
      this.loaderIcon.classList.remove('circle-loader--visible');
    }

    openOverlay(){
        this.overlay.classList.add('search-overlay--visible');
    }

    closeOverlay(){
        this.overlay.classList.remove('search-overlay--visible');
    }

    injectHTML(){
        document.body.insertAdjacentHTML('beforeend',`<div class="search-overlay ">
        <div class="search-overlay-top shadow-sm">
          <div class="container container--narrow">
            <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
            <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
            <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
          </div>
        </div>
    
        <div class="search-overlay-bottom">
          <div class="container container--narrow py-3">
            <div class="circle-loader"></div>
            <div class="live-search-results"> </div>
          </div>
        </div>
      </div>`)
    }
}