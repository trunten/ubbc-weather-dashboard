const apiKey = "9360e4432a25de1431e1a190bc4aca95";
const unsplashId = "_5uHOtETr7A0g87rXm5bnFFv8z-frUbW5u3Q9d8qeAk";
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
    

    const url = `https://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`
    fetch(url).then(res => res.json()).then(data => {
        forecast = data.list.filter(item => item.dt_txt.includes("12:00"));
        for (let i = 0; i < forecast.length; i++) {
            const day = forecast[i];
            const el = document.querySelector(".day" + (i + 1));
            const dt = new Date(day.dt * 1000);
            // console.log(dt.toLocaleDateString("en-gb", { weekday:"short", day:"numeric", month:"short"}));
            el.dataset.date = dt.toLocaleDateString();
            el.dataset.temp = day.main.temp;
            el.dataset.temp_max = day.main.temp_max;
            el.dataset.temp_min = day.main.temp_min;
            el.dataset.description = day.weather[0].description;
            el.dataset.humidity = day.main.humidity;
            el.dataset.wind = day.wind.speed;
            el.dataset.wind_direction = day.wind.deg;
            el.dataset.icon = day.weather[0].icon;
        }
        updateForecast();
    });

    
    // background image from unsplash api
    const dayNight = icon.slice(-1)==="d" ? "" : "night";
    fetchBackgroundImage({ name:name, dayNight: dayNight, description: description })

    document.querySelector(".app").classList.add("visible");
    document.querySelector(".app").classList.remove("invisible");
}

function updateCurrentWeather(values) {
    const weather = document.querySelector(".main-body");
    if (!values) {
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
    }

    weather.querySelector(".location").textContent = values.name;
    weather.querySelector(".date").textContent = values.date;
    weather.querySelector(".temperature-current").textContent = getTemp(values.temp);
    weather.querySelector(".temperature-max span").textContent = getTemp(values.temp_max);
    weather.querySelector(".temperature-min span").textContent = getTemp(values.temp_min);
    weather.querySelector(".description").textContent = values.description;
    weather.querySelector(".humidity span").textContent = values.humidity;
    weather.querySelector(".wind-speed span").textContent = values.wind;
    weather.querySelector(".wind-direction-arrow").style.setProperty('--direction', values.wind_direction + "deg");
    weather.querySelector(".icon").src = `https://openweathermap.org/img/wn/${values.icon}@2x.png`;
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

function fetchBackgroundImage(options) {
    const name = options.name || "";
    const dayNight = options.dayNight || "";
    const description = options.description || "";
    fetch (`https://api.unsplash.com/search/photos?client_id=${unsplashId}&page=1&per_page=40&orientation=landscape&query=${name}+landmarks`)
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
    temp = parseInt(temp);
    if (units === "F") {
        temp = (temp * (9/5)) + 32;
    } 
    return temp.toFixed(decimals) + "°" + units;
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
}