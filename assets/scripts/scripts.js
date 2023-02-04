const apiKey = "9360e4432a25de1431e1a190bc4aca95";
const unsplashId = "_5uHOtETr7A0g87rXm5bnFFv8z-frUbW5u3Q9d8qeAk";
let history = JSON.parse(localStorage.getItem("searches")) || [];

function getWeather (location) {
    // const url = `http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${apiKey}`
    const url = `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${location}&appid=${apiKey}`
    fetch(url)
        .then(res => res.json())
        .then(data => updateWeather(data));
}

function updateWeather(data) {
    if (data.message) {
        alert(data.message);
        return;
    } 
    const name = data.name;
    addToSearchHistory(name);
    const { description, icon } = data.weather[0];
    const { temp, temp_min, temp_max, humidity } = data.main;
    const { speed, deg } = data.wind;
    const { lat, lon } = data.coord;
    document.querySelector(".location").innerText = name;
    document.querySelector(".temperature-current").innerText = `${temp.toFixed(1)}°C`; //(${temp_min}, ${temp_max})`;
    document.querySelector(".temperature-max span").innerText = `${temp_max.toFixed(1)}°C`; //(${temp_min}, ${temp_max})`;
    document.querySelector(".temperature-min span").innerText = `${temp_min.toFixed(1)}°C`; //(${temp_min}, ${temp_max})`;
    document.querySelector(".description").innerText = description;
    document.querySelector(".humidity span").innerText = humidity;
    document.querySelector(".wind-speed span").innerText = speed;
    document.querySelector(".wind-direction-arrow").style.setProperty('--direction', deg + "deg")
    document.querySelector(".icon").src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    const dayNight = icon.slice(-1)==="d" ? "daytime" : ",nighttime";

    const url = `http://api.openweathermap.org/data/2.5/forecast?units=metric&lat=${lat}&lon=${lon}&appid=${apiKey}`
    fetch(url).then(res => res.json()).then(data => {
        forecast = data.list.filter(item => item.dt_txt.includes("12:00"));
        for (let i = 0; i < forecast.length; i++) {
            const day = forecast[i];
            const el = document.querySelector(".day" + i);
            console.log(day, el);
            let dt = new Date(day.dt * 1000);
            console.log(dt.toLocaleDateString("en-gb", { weekday:"short", day:"numeric", month:"short"}));
            document.querySelector(`.day${(i+1)} .date`).textContent = dt.toLocaleDateString();
            document.querySelector(`.day${(i+1)} .temp span`).textContent = day.main.temp;
            document.querySelector(`.day${(i+1)} .humidity span`).textContent = day.main.humidity;
            document.querySelector(`.day${(i+1)} .wind span`).textContent = day.wind.speed;
        }
    });
    
    fetch (`https://api.unsplash.com/search/photos?client_id=${unsplashId}&page=1&per_page=40&orientation=landscape&query=${name.replaceAll(" ",",")},${dayNight}`)
    .then(res => res.json())
    .then(data => {
        if (!data.errors) {
            const img = new Image;
            const results = data.results //.filter(item => item.height > 3500);
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

function search(e) {
    if (e) { e.preventDefault(); }
    document.querySelector(".history").classList.remove("expanded");
    let location = document.querySelector(".search input").value.trim() || "london";
    if (location) { getWeather(location) }
}

function addToSearchHistory(name) {
    if (name && name.trim() && !history.includes(name)) {
        history.unshift(name)
        if (history.length > 10) {
            history.pop();
        }
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
        a.textContent = location;
        a.dataset.location = location;
        searches.appendChild(a);
    }
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