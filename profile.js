
// display current user if available
const emailEl = document.getElementById("userEmail");
if(emailEl) emailEl.innerText = localStorage.getItem("loggedUser") || "";

// Simulated Interaction Data

const user = {

reads:15,
bookmarks:6,
likes:8

};


// display numbers

document.getElementById("reads").innerText =
user.reads;

document.getElementById("bookmarks").innerText =
user.bookmarks;

document.getElementById("likes").innerText =
user.likes;


// Engagement Score Calculation

const engagementScore =
user.reads +
(user.bookmarks * 2) +
(user.likes * 3);


const badge =
document.getElementById("badge");


// User Level Logic (PLSQL Mapping)

if(engagementScore > 50){

badge.innerText="Premium User ⭐";

badge.className +=
" bg-yellow-500";

}

else if(engagementScore > 25){

badge.innerText="Standard User";

badge.className +=
" bg-blue-500";

}

else{

badge.innerText="Basic User";

badge.className +=
" bg-gray-500";

}