'use strict';

var timeoutID;

function initPasswordToggle(inputId, eyeId) {
    const passwordInput = document.querySelector(inputId)
    const eye = document.querySelector(eyeId)

    eye.addEventListener("click", function() {
        this.classList.toggle("fa-eye-slash")
        this.classList.toggle("fa-eye")
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password"
        passwordInput.setAttribute("type", type)
    });
}

function register(event) {
    event.preventDefault();

    clearTimeout(timeoutID);

    var status =  document.getElementById("registerStatus");
    status.classList.remove("error");
    status.innerHTML = "Please wait...";

    var form = document.getElementById("registerForm");
    const formData = new FormData(form);

    var object = {};
    formData.forEach((value, key) => {
        object[key] = value;
    });

    var json = JSON.stringify(object);

    fetch('/register', {
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

function login(event) {
    event.preventDefault();

    clearTimeout(timeoutID);
    
    var status =  document.getElementById("loginStatus");
    status.classList.remove("error");
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

function inputFilter(event) {
    let regEx = /[A-Za-z0-9-_]/;

    if (this.value.length >= 32) {
        event.preventDefault();
        return;
    }
    
    if (this.value.length == 0) {
        regEx = /[A-Za-z]/;
    }
    
    let symbol = String.fromCharCode(event.keyCode);
    if (!regEx.test(symbol) && event.keyCode != 13) {
        event.preventDefault();
    }
}
        
document.addEventListener("DOMContentLoaded", function() {
    initPasswordToggle("#registerPassword", "#registerEye");
    initPasswordToggle("#registerConfirmPassword", "#registerConfirmEye");
    initPasswordToggle("#loginPassword", "#loginEye");

    document.getElementById('registerUsername').addEventListener('keypress', inputFilter);
    document.getElementById('loginUsername').addEventListener('keypress', inputFilter);
});
