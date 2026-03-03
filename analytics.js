
// show logged in email
const emailEl = document.getElementById("userEmail");
if(emailEl) emailEl.innerText = localStorage.getItem("loggedUser") || "";

// CATEGORY COUNT (Aggregation from real articles)
const categoryCount = {};
articles.forEach(article => {
    categoryCount[article.category] =
        (categoryCount[article.category] || 0) + 1;
});


// BAR CHART

new Chart(

document.getElementById("categoryChart"),

{

type:"bar",

data:{

labels:Object.keys(categoryCount),

datasets:[{

label:"Articles",

data:Object.values(categoryCount),

backgroundColor:"#3b82f6"

}]

}

});




// AVERAGE RATING (Aggregation)

const ratings = articles.map(a=>a.rating);

const avgRating =
    ratings.reduce((a,b)=>a+b,0)/ratings.length;
const remaining = Math.max(0, 5 - avgRating);

new Chart(
    document.getElementById("ratingChart"),
    {
        type:"pie",
        data:{
            labels:["Average Rating","Remaining"],
            datasets:[{
                data:[avgRating, remaining],
                backgroundColor:["#22c55e","#374151"]
            }]
        }
    }
);