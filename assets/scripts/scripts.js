const apiKey = "9360e4432a25de1431e1a190bc4aca95";

function getWeather (location) {
    const url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${location}&appid=${apiKey}`
    fetch(url)
        .then(res => res.json())
        .then(data => updateWeather(data));
}

function updateWeather(data) {
    console.log(data);
    if (data.message) {
        alert(data.message);
        return;
    } 

    const name = data.name;
    const { description, icon } = data.weather[0];
    const { temp, temp_min, temp_max, humidity } = data.main;
    const { speed, deg } = data.wind;
    document.querySelector(".location").innerText = name;
    document.querySelector(".temperature").innerText = `${temp}°C`; //(${temp_min}, ${temp_max})`;
    document.querySelector(".description").innerText = description;
    document.querySelector(".humidity span").innerText = humidity;
    document.querySelector(".wind span").innerText = speed;
    document.querySelector(".icon").src = `http://openweathermap.org/img/wn/${icon}@2x.png`;
    const img = new Image;
    img.src = `https://source.unsplash.com/1600x1050/?${name}`;
    if (img.complete || img.height > 0) {
        loadImage();
    } else {
        img.onload = loadImage;
    }
    document.querySelector(".app").classList.remove("invisible");
    setTimeout(function() {document.querySelector(".forecast").classList.remove("invisible");}, 500);

    function loadImage() {
        document.body.style.backgroundImage = `url(${img.src})`;
    }
}

function search(e) {
    if (e) { e.preventDefault(); }
    let location = document.querySelector(".search input").value.trim() || "london";
    if (location) { getWeather(location) }
}

document.querySelector(".search button").addEventListener("click", search);
document.querySelector(".search input").addEventListener("keyup", function(e) {
    if (e.key === "Enter") { search(e); }
});

document.querySelector(".start input").addEventListener("keyup", function(e) {
    if (e.key === "Enter") { 
        document.querySelector(".search input").value = this.value || "London";
        search(e);
     }
});
document.querySelector(".start button").addEventListener("click", function(e) {
        document.querySelector(".search input").value = this.value || "London";
        search(e); 
});