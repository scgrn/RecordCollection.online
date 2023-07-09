'use strict';

var timeoutID;

function initPasswordToggle(inputId, eyeId) {
    const passwordInput = document.querySelector(inputId)
    const eye = document.querySelector(eyeId)

    eye.addEventListener("click", function(){
        this.classList.toggle("fa-eye-slash")
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
        passwordInput.setAttribute("type", type)
    })            
}

function register(event) {
    event.preventDefault();
}

function login(event) {
    event.preventDefault();

    clearTimeout(timeoutID);
    
    var status =  document.getElementById("status");
    status.innerHTML = "Please wait...";

    var form = document.getElementById("loginForm");
    const formData = new FormData(form);

    var object = {};
    formData.forEach((value, key) => {
        object[key] = value;
    });

    var json = JSON.stringify(object);

    fetch('/auth', {
        method: "POST",
        redirect: "follow",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
        },
        body: json
    }).then(async (response) => {
        console.log(response);
            if (response.redirected) {
               window.location.href = response.url;
               return;
            } 
            
            response.clone().json().then((data) => {
            console.log(data);

            status.innerHTML = data.message;

            if (data.code == 0) {
                status.classList.remove("error");
                form.reset();
            } else {
                status.classList.add("error");
            }
        }).catch((error) => {
            console.log(error);
            status.classList.add("error");
            status.innerHTML = "Something went wrong!";
        }).then(function () {
            timeoutID = setTimeout(() => {
                status.classList.remove("error");
                status.innerHTML = "&nbsp;";
            }, 3500);
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    initPasswordToggle("#registerPassword", "#registerEye");
    initPasswordToggle("#registerConfirmPassword", "#registerConfirmEye");
    initPasswordToggle("#loginPassword", "#loginEye");
});