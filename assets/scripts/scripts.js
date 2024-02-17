// Global Variables
//=================

// API key for weather
const apiKey = "9360e4432a25de1431e1a190bc4aca95";

// Reference for available background images
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

let units, history, currentFocus;

// Let's goooooo!
init();

// Gets weather data from API for searched location
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
    //                 showAlert("Country/city not found");
    //             }
    //         });   
    // }

    const url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${location}&appid=${apiKey}`
        fetch(url)
            .then(res => res.json())
            .then(data => parseWeather(data))
  
}

// Parses all the weather data to pull out the required values
function parseWeather(data) {
    if (data.message) {
        showAlert(data.message);
        return;
    } 

    // I need the date to display as the local date for the city searched for.
    // data.dt will be the time at GMT 0 so to format that as if I lived in the reference city I must first
    // change the hourse by the timezone offset, then turn that back to a date (which will technically be
    // invalid) just so I can then output the date in the format that is customary to the end user.
    // Definitely should just use moment.js or similar but just wnat to see if I can wrangle dates in JS 🤣
    const timezoneOffset = data.timezone / 3600;
    const today = new Date(data.dt * 1000);
    today.setHours(today.getHours() + timezoneOffset);
    const localDate = new Date(today.toUTCString().replace("GMT","")).toLocaleDateString(); // Current date for searched city but in user-local time format
    
    const name = data.name;
    const { main, description, icon } = data.weather[0];
    const { temp, temp_min, temp_max, humidity } = data.main;
    const { speed, deg } = data.wind;
    const { lat, lon } = data.coord;
    addToSearchHistory(name, data.sys.country, lat, lon);
    const weather = document.querySelector(".main-body");
    weather.dataset.name = name;
    weather.dataset.date = localDate;
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
        data.list.forEach((item) => {
            // Get date from the list item in GMT
            let dt = new Date(item.dt * 1000); 

            // Change GMT date based on location timezone
            dt.setHours(dt.getHours() + timezoneOffset);

            // This is not actually the true time anywhere, just allows me to
            // format the date in the user-local format and get the hour of the
            // item as if I was living in the searched locaiton.
            dt = new Date(dt.toUTCString().replace("GMT",""))

            // Set the dt value in the item to this new date string so I can ignore the
            // current day (again, the current day as if I was living in the searched location)
            item.dt = dt.toLocaleDateString();

            // Ignore today, got that already
            if (item.dt !== localDate) {
                // Store the max and min temperature for this 3 hour period so 
                // I can then get the day's overall max / min
                if (!minmax[item.dt]) {
                    minmax[item.dt] = { min: item.main.temp_min, max: item.main.temp_max };
                } else {
                    minmax[item.dt].min = Math.min(item.main.temp_min, minmax[item.dt].min);
                    minmax[item.dt].max = Math.max(item.main.temp_max, minmax[item.dt].max);
                }
                // If the timestamp for this item is the middle of the day use this as the 
                // reference for the temperature, wind, etc.
                if (dt.getHours() >= 12 && dt.getHours() < 15) { forecast.push(item); }
            }
        })
        // If it's still before noon in the searched location we won't have an item for midday.
        // In this instance just get the latest time available for the reference period.
        if (forecast.length < 5) { forecast.push(data.list.pop()); }

        // Set dataset values for the card (I output later. Need values stored for "more detail" button)
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
            el.dataset.icon = day.weather[0].icon.replace("n","d"); // For some reason it's sometimes returning night icons even at midday!!!
        });

        // Output the save value to the html doc
        updateForecast();
    });

    // Shows the whole UI if this is the first search.
    document.querySelector(".app").classList.add("visible");
    document.querySelector(".app").classList.remove("invisible");
}

// Renders the saved values for the current weather to the screen.
// Optionally allows values to be passed that will get used instead - this
// is for the the "more detail" button on the forecast cards.
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
        currentFocus = null;
    } else {
        document.querySelector(".main-body-header > button").classList.remove("hide");
        currentFocus = values;
    }

    weather.querySelector(".location").textContent = values.name || weather.dataset.name;
    weather.querySelector(".date").textContent = values.date;
    weather.querySelector(".temperature-current").textContent = getTemp(values.temp);
    weather.querySelector(".temperature-max span").textContent = getTemp(values.temp_max);
    weather.querySelector(".temperature-min span").textContent = getTemp(values.temp_min);
    weather.querySelector(".description").textContent = values.description;
    weather.querySelector(".humidity span").textContent = values.humidity;
    weather.querySelector(".wind-speed span").textContent = (values.wind * speedFactor()).toFixed(2) + " " + units.speed;
    weather.querySelector(".wind-direction-arrow").style.setProperty('--direction', values.wind_direction + "deg");
    weather.querySelector(".icon").src = `https://openweathermap.org/img/wn/${values.icon}@2x.png`;

    // Update background image to reflect weather conditions
    fetchBackgroundImage(values.icon);
}

// Renders the saved values for each forecast "card" to the screen.
function updateForecast() {
    const forecast = document.querySelectorAll(".forecast .card");
    for (let day of forecast) {
        day.querySelector(`.date`).textContent = day.dataset.date;
        day.querySelector(`.description`).textContent = day.dataset.description;
        day.querySelector(`.temp span`).textContent = getTemp(day.dataset.temp);
        day.querySelector(`.humidity span`).textContent = day.dataset.humidity;
        day.querySelector(`.wind span`).textContent = (day.dataset.wind * speedFactor()).toFixed(2) + " " + units.speed;
        day.querySelector(".icon_small").src = `https://openweathermap.org/img/wn/${day.dataset.icon}.png`;
    }
}

// Get's a background image from my background assets based on weather conditions.
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
    // (pulls a random image from unsplash using the location name)
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

// Checks to see if a value has been entered then passes lcation on to getWeather to query API
function search(e) {
    if (e) { e.preventDefault(); }
    document.querySelector(".history").classList.remove("expanded");
    let location = document.querySelector(".search input").value.trim(); // || "london";
    if (location) { getWeather(location) }
}

// Adds searched location to history if it's not there already. Moves locaiton
// to the top if it is there already.
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

    // Wait a bit unti render so that the history pain can collapse fully if it was expanded.
    setTimeout(renderSearchHistory, 1000);
}

// Renders pervious searches to the screen. Limited to 10 because it was starting to get a bit
// excessive when outputting litterally every search ever made. I still keep this extra info though
// just inc ase I decide to add more later or let the user control the list length.
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

// Updates the temperature to display in the user preferred format (celcius or fahrenheit).
function updateTemperature(selectedUnits) {
    units.temp = (selectedUnits.toUpperCase() === "F") ? "F" : "C";
    localStorage.setItem("units", JSON.stringify(units));
    const cards = document.querySelectorAll(".card");
    for (let card of cards) {
        const isMainCard = !!card.querySelector(".temperature-max");
        card.querySelector(isMainCard ? ".temperature-current" : ".temp span").textContent = getTemp(currentFocus?.temp || card.dataset.temp);
        if (isMainCard) {
            card.querySelector(".temperature-max span").textContent = getTemp(currentFocus?.temp_max || card.dataset.temp_max);
            card.querySelector(".temperature-min span").textContent = getTemp(currentFocus?.temp_min || card.dataset.temp_min);
        }
    }
}

// Returns the temperature in the user preferred format (celcius or fahrenheit) based on a celcius input.
function getTemp(temp, decimals = 1) {
    temp = parseFloat(temp);
    if (units && units.temp === "F") {
        temp = (temp * (9/5)) + 32;
    } 
    return temp.toFixed(decimals) + "°" + units.temp;
}

// Works out mph or km/h multiplier depeding on user selection
function speedFactor() {
  if (units && units.speed === "mph") return 2.23694;
  return 3.6;
}

function updateSpeed(speed) {
  units.speed = speed;
  localStorage.setItem("units", JSON.stringify(units));
  const cards = document.querySelectorAll(".card");
  for (let card of cards) {
      const isMainCard = !!card.querySelector(".temperature-max");
      const wind = (isMainCard && currentFocus) ? currentFocus.wind : card.dataset.wind;
      card.querySelector(isMainCard ? ".wind-speed span" : ".wind span").textContent = (wind * speedFactor()).toFixed(2) + " " + units.speed;
  }
}

// Pushes the forecast data to the main panel when the "more detail" button is clicked.
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
    window.scrollTo(0,0);
}

// Shows a modal alert
function showAlert(message) {
    if (!message || !message.trim()) { message = "Alert!" }
    document.querySelector("#alertMessage").textContent = message;
    document.querySelector("#alert").showModal();
}

// Initialise 
function init() {
    // Get user saved temperature units from local storage
    try {
      units = JSON.parse(localStorage.getItem("units"));
      if (typeof units === 'string' || units instanceof String) { units = {temp:"C", speed:"km/h"}; }
    } catch {
      units = {temp:"C", speed:"km/h"};
    }
    if (!units) { units = {temp:"C", speed:"km/h"}; }
    if (units.temp === "F") {
        document.querySelector("#fahrenheit").checked = true;
    }
    if (units.speed === "mph") {
      document.querySelector("#mph").checked = true;
    }

    // Get search history from local storage
    history = JSON.parse(localStorage.getItem("searches")) || [];
    if (history.length) {
        if (!history[0].lat) history = [];
    }
    renderSearchHistory();

    // Add event listeners
    document.querySelector("#alert").addEventListener("click", e => document.querySelector("#alert").close() );

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

    document.querySelector(".temp-toggle").addEventListener("click", function() {
        const left = document.querySelector("#celcius");
        const right = document.querySelector("#fahrenheit");
        if (left.checked) {
            right.checked = true;
            updateTemperature("f");
        } else {
            left.checked = true;
            updateTemperature("c");
        }
    });

    document.querySelector(".speed-toggle").addEventListener("click", function() {
      const left = document.querySelector("#kmh");
      const right = document.querySelector("#mph");
      if (left.checked) {
          right.checked = true;
          updateSpeed("mph");
      } else {
          left.checked = true;
          updateSpeed("km/h");
      }

    });

    document.querySelectorAll(".units label").forEach(el => {
      el.addEventListener("click", function() {
        if (el.dataset.temp) {
          updateTemperature(el.dataset.temp);
        } else {
          updateSpeed(el.dataset.speed);
        }
      });
    });

    document.querySelector(".main-body-header > button").addEventListener("click", ()=>updateCurrentWeather());

    document.querySelectorAll(".forecast .card button").forEach(btn => {
        btn.addEventListener("click", displayForecastDetail);
    });

}

