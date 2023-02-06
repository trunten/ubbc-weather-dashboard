const apiKey = "9360e4432a25de1431e1a190bc4aca95";
const unsplashId = "_5uHOtETr7A0g87rXm5bnFFv8z-frUbW5u3Q9d8qeAk";
const images = {
    icon_01d: ["day-clear-sky.jpg"],
    icon_02d: ["day-few-clouds.jpg"],
    icon_03d: ["day-scattered-clouds.jpg"],
    icon_04d: ["day-broken-clouds.jpg"],
    icon_09d: ["day-shower-rain.jpg"],
    icon_10d: ["day-rain.jpg"],
    icon_11d: ["day-thunderstorm.jpg", "day-thunderstorm-2.jpg"],
    icon_13d: ["day-snow.jpg", "day-snow-2.jpg", "day-snow-3.jpg"],
    icon_50d: ["day-mist.jpg", "day-mist-2.jpg", "day-mist-3.jpg", "day-mist-4.jpg", "day-mist-5.jpg"],
    icon_01n: ["night-clear-sky.jpg", "night-clear-sky-2.jpg"],
    icon_02n: ["night-few-clouds.jpg", "night-few-clouds-2.jpg"],
    icon_03n: ["night-scattered-clouds.jpg"],
    icon_04n: ["night-broken-clouds.jpg", "night-broken-clouds-2.jpg"],
    icon_09n: ["night-shower-rain.jpg"],
    icon_10n: ["night-rain.jpg"],
    icon_11n: ["night-thunderstorm.jpg", "night-thunderstorm-2.jpg", "night-thunderstorm-3.jpg"],
    icon_13n: ["night-snow.jpg"],
    icon_50n: ["night-mist.jpg", "night-mist-2.jpg", "night-mist-3.jpg"],
    bg: ["bg-initial-1.jpg", "bg-initial-2.jpg", "bg-initial-3.jpg", "bg-initial-4.jpg", "bg-initial-5.jpg"],
};

let units, history;

// Let's goooooo!
init();


function getWeather (location) {
    // Bizzarely, using geolocation + lat/lon was more unreliable than using a query.
    // Eg, searching for Tokyo returned a location lat/lon that reported as "Japan" when getting the forecast data.
    // Reverting to query because it actually works better.
    // const re = RegExp(location, "i");
    // const historyMatch = history.filter(loc => re.test(loc.name));
    // let url = "";
    // if (historyMatch.length) {
    //     const { lat, lon } = historyMatch[0];
    //     url = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`
    //     fetch(url).then(res => res.json()).then(data => parseWeather(data));
    // } else {
    //     url = `http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=10&appid=${apiKey}`
    //     fetch(url)
    //         .then(res => res.json())
    //         .then(data => {
    //             console.log(data);
    //             if (data.length) {
    //                 const { lat, lon } = data[0]
    //                 url = `https://api.openweathermap.org/data/2.5/weather?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`
    //                 fetch(url).then(res => res.json()).then(data => parseWeather(data));
    //             } else {
    //                 alert("Country/city not found");
    //             }
    //         });   
    // }

    const url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${location}&appid=${apiKey}`
        fetch(url)
            .then(res => res.json())
            .then(data => parseWeather(data))
  
}

function parseWeather(data) {
    if (data.message) {
        alert(data.message);
        return;
    } 
    const name = data.name;
    let dt = new Date(data.dt * 1000);
    const { main, description, icon } = data.weather[0];
    const { temp, temp_min, temp_max, humidity } = data.main;
    const { speed, deg } = data.wind;
    const { lat, lon } = data.coord;
    addToSearchHistory(name, data.sys.country, lat, lon);
    const weather = document.querySelector(".main-body");
    weather.dataset.name = name;
    weather.dataset.date = dt.toLocaleDateString();
    weather.dataset.temp = temp;
    weather.dataset.temp_max = temp_max; 
    weather.dataset.temp_min = temp_min; 
    weather.dataset.description = description;
    weather.dataset.humidity = humidity;
    weather.dataset.wind = speed;
    weather.dataset.wind_direction = deg;
    weather.dataset.icon = icon;
    updateCurrentWeather();

    // 5 day forecast data from lat and lon of main location
    const url = `https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`;
    fetch(url).then(res => res.json()).then(data => {
        const forecast = [];
        const minmax = {};
        const today = new Date().toLocaleDateString();
        data.list.forEach((item) => {
            let dt = new Date(item.dt * 1000);
            item.dt = dt.toLocaleDateString();
            if (item.dt !== today) {
                if (!minmax[item.dt]) {
                    minmax[item.dt] = { min: item.main.temp_min, max: item.main.temp_max };
                } else {
                    minmax[item.dt].min = Math.min(item.main.temp_min, minmax[item.dt].min);
                    minmax[item.dt].max = Math.max(item.main.temp_max, minmax[item.dt].max);
                }
                if (dt.getHours() === 12) { forecast.push(item); }
            }
        })
        if (forecast.length < 5) { forecast.push(data.list.pop()); }
        forecast.forEach((day, i) => {
            const el = document.querySelector(".day" + (i + 1));
            el.dataset.date = day.dt; 
            el.dataset.temp = day.main.temp;
            el.dataset.temp_max = minmax[day.dt].max;
            el.dataset.temp_min = minmax[day.dt].min;
            el.dataset.description = day.weather[0].description;
            el.dataset.humidity = day.main.humidity;
            el.dataset.wind = day.wind.speed;
            el.dataset.wind_direction = day.wind.deg;
            el.dataset.icon = day.weather[0].icon;
        });
        updateForecast();
    });

    document.querySelector(".app").classList.add("visible");
    document.querySelector(".app").classList.remove("invisible");
}

function updateCurrentWeather(values) {
    const weather = document.querySelector(".main-body");
    if (!values) {
        document.querySelector(".main-body-header > button").classList.add("hide");
        values = {
            name: weather.dataset.name,
            date: weather.dataset.date,
            temp: weather.dataset.temp,
            temp_max: weather.dataset.temp_max,
            temp_min: weather.dataset.temp_min,
            description: weather.dataset.description,
            humidity: weather.dataset.humidity,
            wind: weather.dataset.wind,
            wind_direction: weather.dataset.wind_direction,
            icon: weather.dataset.icon,
        }
    } else {
        document.querySelector(".main-body-header > button").classList.remove("hide");
    }

    weather.querySelector(".location").textContent = values.name || weather.dataset.name;
    weather.querySelector(".date").textContent = values.date;
    weather.querySelector(".temperature-current").textContent = getTemp(values.temp);
    weather.querySelector(".temperature-max span").textContent = getTemp(values.temp_max);
    weather.querySelector(".temperature-min span").textContent = getTemp(values.temp_min);
    weather.querySelector(".description").textContent = values.description;
    weather.querySelector(".humidity span").textContent = values.humidity;
    weather.querySelector(".wind-speed span").textContent = values.wind;
    weather.querySelector(".wind-direction-arrow").style.setProperty('--direction', values.wind_direction + "deg");
    weather.querySelector(".icon").src = `https://openweathermap.org/img/wn/${values.icon}@2x.png`;

    fetchBackgroundImage(values.icon);
}

function updateForecast() {
    const forecast = document.querySelectorAll(".forecast .card");
    for (let day of forecast) {
        day.querySelector(`.date`).textContent = day.dataset.date;
        day.querySelector(`.description`).textContent = day.dataset.description;
        day.querySelector(`.temp span`).textContent = getTemp(day.dataset.temp);
        day.querySelector(`.humidity span`).textContent = day.dataset.humidity;
        day.querySelector(`.wind span`).textContent = day.dataset.wind;
        day.querySelector(".icon_small").src = `https://openweathermap.org/img/wn/${day.dataset.icon}.png`;
    }
}

function fetchBackgroundImage(icon) {
    const img = new Image();
    let src;
    if (icon) {
        // Use local backgrounds
        const backgrounds = images["icon_" + icon];
        if (backgrounds) {
            src = "./assets/images/" + backgrounds[Math.floor(Math.random() * backgrounds.length)]
        } 
    }

    // Just in case the api adds new icons at some point this will act as a fallback
    if (!src) { 
        const weather = document.querySelector(".main-body");
        src = weather.dataset.name || "weather";
        src = `https://source.unsplash.com/1600x900/?${src}`;
    }

    // Load the image before updating background
    img.src = src;
    if (img.complete || img.height > 0) {
        loadImage();
    } else {
        img.onload = loadImage;
    }

    // Inner function to update background image once it has loaded
    function loadImage() {
        document.body.style.backgroundImage = `url(${img.src})`;    
    }
    
    
}

function search(e) {
    if (e) { e.preventDefault(); }
    document.querySelector(".history").classList.remove("expanded");
    let location = document.querySelector(".search input").value.trim() || "london";
    if (location) { getWeather(location) }
}

function addToSearchHistory(name, country, lat, lon) {
    if (name && name.trim() && lat && lon) {
        history.forEach((item, i) => {
            if (item.name === name) {
                history.splice(i,1);
            }
        })
        const location = {name: name, country: country, lat: lat, lon: lon}
        history.unshift(location)
        localStorage.setItem("searches", JSON.stringify(history))
    }
    setTimeout(renderSearchHistory, 1000);
}

function renderSearchHistory() {
    const searches = document.querySelector(".searches");
    searches.textContent = "";
    for (let i = 0; i < Math.min(10, history.length); i++) {
        const location = history[i];
        const a = document.createElement("a")
        a.href = "#";
        a.textContent = location.name;
        a.dataset.location = location.name;
        // a.dataset.lat = location.lat;
        // a.dataset.lon = location.lon;
        searches.appendChild(a);
    }
}

function updateTemperature(selectedUnits) {
    units = (selectedUnits.toUpperCase() === "F") ? "F" : "C";
    localStorage.setItem("units", units);
    const cards = document.querySelectorAll(".card");
    for (let card of cards) {
        const minmax = !!card.querySelector(".temperature-max");
        card.querySelector(minmax ? ".temperature-current" : ".temp span").textContent = getTemp(card.dataset.temp);
        if (minmax) {
            card.querySelector(".temperature-max span").textContent = getTemp(card.dataset.temp_max);
            card.querySelector(".temperature-min span").textContent = getTemp(card.dataset.temp_min);
        }
    }
}

function getTemp(temp, decimals = 1) {
    temp = parseFloat(temp);
    if (units === "F") {
        temp = (temp * (9/5)) + 32;
    } 
    return temp.toFixed(decimals) + "°" + units;
}

function displayForecastDetail(e) {
    const card = e.target.parentNode;
    values = {
        date: card.dataset.date,
        temp: card.dataset.temp,
        temp_max: card.dataset.temp_max,
        temp_min: card.dataset.temp_min,
        description: card.dataset.description,
        humidity: card.dataset.humidity,
        wind: card.dataset.wind,
        wind_direction: card.dataset.wind_direction,
        icon: card.dataset.icon,
    }
    updateCurrentWeather(values);
}


// init 
function init() {
    units = localStorage.getItem("units") || "C";
    if (units === "F") {
        document.querySelector("#fahrenheit").checked = true;
    }

    history = JSON.parse(localStorage.getItem("searches")) || [];
    if (history.length) {
        if (!history[0].lat) history = [];
    }
    renderSearchHistory();

    document.querySelector(".search button").addEventListener("click", search);
    document.querySelector(".search input").addEventListener("keyup", function(e) {
        if (e.key === "Enter") { search(e); }
    });

    document.querySelector(".history").addEventListener("click", function(e) {
        document.querySelector(".history").classList.toggle("expanded");
        if (e.target.dataset.location) {
            document.querySelector(".search input").value = e.target.dataset.location
            search(e);
        }
    });

    document.querySelector(".units-toggle").addEventListener("click", function() {
        const cel = document.querySelector("#celcius");
        const fah = document.querySelector("#fahrenheit");
        if (cel.checked) {
            fah.checked = true;
            updateTemperature("f");
        } else {
            cel.checked = true;
            updateTemperature("c");
        }
    });

    document.querySelector(".main-body-header > button").addEventListener("click", ()=>updateCurrentWeather());

    document.querySelectorAll(".forecast .card button").forEach(btn => {
        btn.addEventListener("click", displayForecastDetail);
    });

}

