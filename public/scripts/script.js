const username = document.getElementById("username");

if (username !== null) {
    username.addEventListener("input", () => {
    if (username.validity.tooShort) {
        username.setCustomValidity("Username should be more than 8 characters");
        username.reportValidity();
    } else {
        username.setCustomValidity("");
    }
    });
}

const password = document.getElementById("password");

if (password !== null) {
    password.addEventListener("input", () => {
    if (password.validity.patternMismatch) {
        password.setCustomValidity("Password should be more than 8 characters with one uppercase letter, one lowercase letter and one digit");
        password.reportValidity();
    } else {
        password.setCustomValidity("");
    }
    });
}

const numServings = document.getElementById("numServings");

if (numServings !== null) {
    numServings.addEventListener("input", () => {
        if (numServings.validity.rangeUnderflow) {
            numServings.setCustomValidity("How can you have less than a single serving?");
            numServings.reportValidity();
        } else {
            numServings.setCustomValidity("");
        }
    });
}

const estimatedTime = document.getElementById("estimatedTime");

if (estimatedTime !== null) {
    estimatedTime.addEventListener("input", () => {
        if (estimatedTime.validity.rangeUnderflow) {
            estimatedTime.setCustomValidity("Hard to believe you can cook under a minute!");
            estimatedTime.reportValidity();
        } else {
            estimatedTime.setCustomValidity("");
        }
    });
}

const estimatedCost = document.getElementById("estimatedCost");

if (estimatedCost !== null) {
    estimatedCost.addEventListener("input", () => {
        if (estimatedCost.validity.rangeUnderflow) {
            estimatedCost.setCustomValidity("Costs you less than a dollar? Hard to buy that.");
            estimatedCost.reportValidity();
        } else {
            estimatedCost.setCustomValidity("");
        }
    });
}

const uploadFile = document.getElementById("file");

if (uploadFile !== null) {
    uploadFile.onchange = function() {
        if(this.files[0].size > 1048576){
           alert("File is bigger than 1MB!");
           this.value = "";
        }
    };
}
