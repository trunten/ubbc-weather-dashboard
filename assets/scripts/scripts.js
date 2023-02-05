const apiKey = "9360e4432a25de1431e1a190bc4aca95";
const unsplashId = "_5uHOtETr7A0g87rXm5bnFFv8z-frUbW5u3Q9d8qeAk";
let history = JSON.parse(localStorage.getItem("searches")) || [];

function getWeather (location) {
    const re = RegExp(location, "i");
    const historyMatch = history.filter(loc => re.test(loc.name));
    let url = "";
    if (historyMatch.length) {
        const { lat, lon } = historyMatch[0];
        url = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`
        fetch(url).then(res => res.json()).then(data => parseWeather(data));
    } else {
        url = `http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=10&appid=${apiKey}`
        fetch(url)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                if (data.length) {
                    const { lat, lon } = data[0]
                    url = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`
                    fetch(url).then(res => res.json()).then(data => parseWeather(data));
                } else {
                    alert("Country/city not found");
                }
            });
        // url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${location}&appid=${apiKey}`
        // fetch(url)
        //     .then(res => res.json())
        //     .then(data => parseWeather(data))
        //     .catch(e => console.log(e));
    }
  
}

function parseWeather(data) {
    if (data.message) {
        alert(data.message);
        return;
    } 
    const name = data.name;
    const { description, icon } = data.weather[0];
    const { temp, temp_min, temp_max, humidity } = data.main;
    const { speed, deg } = data.wind;
    const { lat, lon } = data.coord;
    addToSearchHistory(name, lat, lon);
    document.querySelector(".location").innerText = name;
    document.querySelector(".temperature-current span").innerText = `${temp.toFixed(1)}`; //(${temp_min}, ${temp_max})`;
    document.querySelector(".temperature-max span").innerText = `${temp_max.toFixed(1)}`; //(${temp_min}, ${temp_max})`;
    document.querySelector(".temperature-min span").innerText = `${temp_min.toFixed(1)}`; //(${temp_min}, ${temp_max})`;
    document.querySelector(".description").innerText = description;
    document.querySelector(".humidity span").innerText = humidity;
    document.querySelector(".wind-speed span").innerText = speed;
    document.querySelector(".wind-direction-arrow").style.setProperty('--direction', deg + "deg")
    document.querySelector(".icon").src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    const dayNight = icon.slice(-1)==="d" ? "daytime" : ",nighttime";

    const url = `https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`
    fetch(url).then(res => res.json()).then(data => {
        forecast = data.list.filter(item => item.dt_txt.includes("12:00"));
        for (let i = 0; i < forecast.length; i++) {
            const day = forecast[i];
            const el = document.querySelector(".day" + (i + 1));
            let dt = new Date(day.dt * 1000);
            // console.log(dt.toLocaleDateString("en-gb", { weekday:"short", day:"numeric", month:"short"}));
            el.dataset.date = dt.toLocaleDateString();
            el.dataset.temp = day.main.temp;
            el.dataset.humidity = day.main.humidity;
            el.dataset.wind = day.wind.speed;
        }
        updateForecast();
    });

    
    // background image
    fetch (`https://api.unsplash.com/search/photos?client_id=${unsplashId}&page=1&per_page=40&orientation=landscape&query=${name.replaceAll(" ",",")},${dayNight}`)
    .then(res => res.json())
    .then(data => {
        if (!data.errors) {
            const img = new Image;
            const results = data.results;
            updateBG();

            function updateBG() {
                const src = results[Math.floor(Math.random() * results.length)].urls.regular;
                img.src = src;
                if (img.complete || img.height > 0) {
                    loadImage();
                } else {
                    img.onload = loadImage;
                }
            }

            function loadImage() {
                if ((img.width/img.height) == 1.5) {
                    document.body.style.backgroundImage = `url(${img.src})`;    
                } else {
                    updateBG();
                }
            }
        }
    })

    document.querySelector(".app").classList.add("visible");
    document.querySelector(".app").classList.remove("invisible");
}

function updateForecast() {
    const forecast = document.querySelectorAll(".forecast .card");
    for (let day of forecast) {
        // console.log(day);
        day.querySelector(`.date`).textContent = day.dataset.date;
        day.querySelector(`.temp span`).textContent = day.dataset.temp;
        day.querySelector(`.humidity span`).textContent = day.dataset.humidity;
        day.querySelector(`.wind span`).textContent = day.dataset.wind;
    }
}

function search(e) {
    if (e) { e.preventDefault(); }
    document.querySelector(".history").classList.remove("expanded");
    let location = document.querySelector(".search input").value.trim() || "london";
    if (location) { getWeather(location) }
}

function addToSearchHistory(name, lat, lon) {
    if (name && name.trim() && lat && lon) {
        history.forEach((item, i) => {
            if (item.name === name) {
                history.splice(i,1);
            }
        })
        const location = {name: name, lat: lat, lon: lon}
        history.unshift(location)
        localStorage.setItem("searches", JSON.stringify(history))
    }
    renderSearchHistory();
}

function renderSearchHistory() {
    const searches = document.querySelector(".searches");
    searches.textContent = "";
    for (let location of history) {
        const a = document.createElement("a")
        a.href = "#";
        a.textContent = location.name;
        a.dataset.location = location.name;
        // a.dataset.lat = location.lat;
        // a.dataset.lon = location.lon;
        searches.appendChild(a);
    }
}

renderSearchHistory();

document.querySelector(".search button").addEventListener("click", search);
document.querySelector(".search input").addEventListener("keyup", function(e) {
    if (e.key === "Enter") { search(e); }
});

document.querySelector(".units-toggle").addEventListener("click", function() {
    const cel = document.querySelector("#celcius");
    const fah = document.querySelector("#fahrenheit");
    if (cel.checked) {
        fah.checked = true;
    } else {
        cel.checked = true;
    }
});

document.querySelector(".history").addEventListener("click", function(e) {
    document.querySelector(".history").classList.toggle("expanded");
    if (e.target.dataset.location) {
        document.querySelector(".search input").value = e.target.dataset.location
        search(e);
    }
});