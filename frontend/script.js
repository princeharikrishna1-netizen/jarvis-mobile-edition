// =====================================================
// J.A.R.V.I.S - COMPLETE AI CORE
// Gemini + Memory + Voice + Vision + 15 TOOLS
// =====================================================


// =====================================================
// 1. API KEY
// =====================================================

let API_KEY = localStorage.getItem("jarvis_key");

if (!API_KEY) {
    API_KEY = prompt("Enter your Gemini API Key:");

    if (API_KEY) {
        localStorage.setItem("jarvis_key", API_KEY);
    }
}


// =====================================================
// 2. GEMINI MODELS
// =====================================================

const MODELS = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
];


// =====================================================
// 3. DOM ELEMENTS
// =====================================================

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const micBtn = document.getElementById("mic-btn");
const clearBtn = document.getElementById("clear-btn");
const camBtn = document.getElementById("cam-btn");
const imgInput = document.getElementById("img-input");
const sendBtn = document.getElementById("send");


// =====================================================
// 4. MEMORY
// =====================================================

let memory = JSON.parse(
    localStorage.getItem("jarvis_memory") || "[]"
);

const MAX_MEMORY = 20;


function saveMemory(role, text) {

    memory.push({
        role: role,
        text: text,
        time: new Date().toISOString()
    });

    if (memory.length > MAX_MEMORY) {
        memory = memory.slice(-MAX_MEMORY);
    }

    localStorage.setItem(
        "jarvis_memory",
        JSON.stringify(memory)
    );
}


// =====================================================
// 5. CHAT UI
// =====================================================

function add(text, who = "JARVIS") {

    if (!chat) return;

    const div = document.createElement("div");

    div.className =
        who === "YOU"
            ? "user-message"
            : "jarvis-message";

    div.innerText = text;

    chat.appendChild(div);

    chat.scrollTop = chat.scrollHeight;
}


// =====================================================
// 6. SPEECH OUTPUT
// =====================================================

function speak(text) {

    if (!("speechSynthesis" in window)) return;

    try {

        speechSynthesis.cancel();

        const cleanText = String(text)
            .replace(/[*_#`]/g, "")
            .replace(/[📍🌤️🌡️💧💨☁️🌧️❄️📅⏰🔢📝]/gu, "");

        const utterance =
            new SpeechSynthesisUtterance(cleanText);

        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        speechSynthesis.speak(utterance);

    } catch (e) {
        console.error("Speech error:", e);
    }
}


// =====================================================
// 7. WEATHER DESCRIPTION
// =====================================================

function weatherDescription(code) {

    const map = {

        0: "Clear sky",
        1: "Mainly clear",
        2: "Partly cloudy",
        3: "Overcast",

        45: "Fog",
        48: "Depositing rime fog",

        51: "Light drizzle",
        53: "Moderate drizzle",
        55: "Dense drizzle",

        56: "Light freezing drizzle",
        57: "Dense freezing drizzle",

        61: "Slight rain",
        63: "Moderate rain",
        65: "Heavy rain",

        66: "Light freezing rain",
        67: "Heavy freezing rain",

        71: "Slight snowfall",
        73: "Moderate snowfall",
        75: "Heavy snowfall",

        77: "Snow grains",

        80: "Slight rain showers",
        81: "Moderate rain showers",
        82: "Violent rain showers",

        85: "Slight snow showers",
        86: "Heavy snow showers",

        95: "Thunderstorm",

        96: "Thunderstorm with slight hail",
        99: "Thunderstorm with heavy hail"
    };

    return map[code] || "Unknown weather";
}


// =====================================================
// 8. GPS LOCATION
// =====================================================

function getBrowserLocation() {

    return new Promise((resolve) => {

        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(

            position => {

                resolve({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,

                    accuracy:
                        Math.round(
                            position.coords.accuracy || 0
                        ),

                    source: "GPS / Browser"
                });

            },

            error => {

                console.log(
                    "Browser location unavailable:",
                    error.code
                );

                resolve(null);
            },

            {
                enableHighAccuracy: true,
                timeout: 12000,
                maximumAge: 300000
            }
        );
    });
}


// =====================================================
// 9. NETWORK LOCATION FALLBACK
// =====================================================

async function getNetworkLocation() {

    // ---------- API 1 ----------
    try {

        const response =
            await fetch(
                "https://ipapi.co/json/",
                {
                    cache: "no-store"
                }
            );

        if (response.ok) {

            const data =
                await response.json();

            if (
                data.latitude &&
                data.longitude
            ) {

                return {

                    lat: Number(data.latitude),
                    lon: Number(data.longitude),

                    city:
                        data.city || "",

                    region:
                        data.region || "",

                    country:
                        data.country_name || "",

                    postal:
                        data.postal || "",

                    source:
                        "Network location estimate",

                    accuracy:
                        "Approximate"
                };
            }
        }

    } catch (error) {

        console.log(
            "Network location API 1 failed"
        );
    }


    // ---------- API 2 ----------
    try {

        const response =
            await fetch(
                "https://ipwho.is/",
                {
                    cache: "no-store"
                }
            );

        if (response.ok) {

            const data =
                await response.json();

            if (
                data.success !== false &&
                data.latitude &&
                data.longitude
            ) {

                return {

                    lat:
                        Number(data.latitude),

                    lon:
                        Number(data.longitude),

                    city:
                        data.city || "",

                    region:
                        data.region || "",

                    country:
                        data.country || "",

                    postal:
                        data.postal || "",

                    source:
                        "Network location estimate",

                    accuracy:
                        "Approximate"
                };
            }
        }

    } catch (error) {

        console.log(
            "Network location API 2 failed"
        );
    }


    return null;
}


// =====================================================
// 10. BEST AVAILABLE LOCATION
// =====================================================

async function getBestLocation() {

    // First try GPS/browser
    let location =
        await getBrowserLocation();

    // If unavailable, network fallback
    if (!location) {

        location =
            await getNetworkLocation();
    }

    if (!location) {
        return null;
    }


    // =================================================
    // REVERSE GEOCODING
    // =================================================

    try {

        const url =
            "https://nominatim.openstreetmap.org/reverse" +
            "?format=jsonv2" +
            "&lat=" + encodeURIComponent(location.lat) +
            "&lon=" + encodeURIComponent(location.lon) +
            "&zoom=18" +
            "&addressdetails=1";

        const response =
            await fetch(url, {
                headers: {
                    "Accept":
                        "application/json"
                }
            });

        if (response.ok) {

            const data =
                await response.json();

            const address =
                data.address || {};

            location.displayName =
                data.display_name || "";

            location.city =
                address.city ||
                address.town ||
                address.municipality ||
                address.village ||
                location.city ||
                "";

            location.district =
                address.city_district ||
                address.district ||
                address.county ||
                "";

            location.state =
                address.state ||
                location.region ||
                "";

            location.country =
                address.country ||
                location.country ||
                "";

            location.area =
                address.suburb ||
                address.neighbourhood ||
                address.residential ||
                "";

            location.road =
                address.road || "";

            location.postcode =
                address.postcode ||
                location.postal ||
                "";

        }

    } catch (error) {

        console.log(
            "Reverse geocoding unavailable"
        );
    }


    return location;
}


// =====================================================
// 11. LOCATION INFORMATION
// =====================================================

async function getLocationInfo() {

    const location =
        await getBestLocation();

    if (!location) {

        return (
            "📍 Location service is unavailable right now, Boss."
        );
    }


    let result =
        "📍 CURRENT LOCATION\n\n";


    if (location.city) {

        result +=
            "City: " +
            location.city +
            "\n";
    }


    if (location.area) {

        result +=
            "Area: " +
            location.area +
            "\n";
    }


    if (location.district) {

        result +=
            "District: " +
            location.district +
            "\n";
    }


    if (location.state) {

        result +=
            "State: " +
            location.state +
            "\n";
    }


    if (location.country) {

        result +=
            "Country: " +
            location.country +
            "\n";
    }


    if (location.postcode) {

        result +=
            "PIN: " +
            location.postcode +
            "\n";
    }


    result +=
        "\nCoordinates: " +
        location.lat.toFixed(6) +
        ", " +
        location.lon.toFixed(6) +
        "\n";


    result +=
        "Source: " +
        (location.source || "Location service");


    if (location.accuracy) {

        result +=
            "\nAccuracy: " +
            location.accuracy +
            (
                typeof location.accuracy === "number"
                    ? " meters"
                    : ""
            );
    }


    return result;
}


// =====================================================
// 12. DETAILED WEATHER
// =====================================================

async function getDetailedWeather() {

    const location =
        await getBestLocation();

    if (!location) {

        return (
            "🌤️ Weather service is unavailable right now, Boss."
        );
    }


    const url =
        "https://api.open-meteo.com/v1/forecast" +

        "?latitude=" +
        encodeURIComponent(location.lat) +

        "&longitude=" +
        encodeURIComponent(location.lon) +

        "&current=" +
        [
            "temperature_2m",
            "relative_humidity_2m",
            "apparent_temperature",
            "is_day",
            "precipitation",
            "rain",
            "showers",
            "snowfall",
            "weather_code",
            "cloud_cover",
            "surface_pressure",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m"
        ].join(",") +

        "&hourly=" +
        [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation_probability",
            "precipitation",
            "weather_code",
            "cloud_cover",
            "wind_speed_10m"
        ].join(",") +

        "&daily=" +
        [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
            "apparent_temperature_max",
            "apparent_temperature_min",
            "precipitation_sum",
            "precipitation_probability_max",
            "wind_speed_10m_max",
            "sunrise",
            "sunset"
        ].join(",") +

        "&timezone=auto";


    try {

        const response =
            await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Weather API failed"
            );
        }


        const data =
            await response.json();


        const current =
            data.current || {};

        const daily =
            data.daily || {};


        const place =
            location.city ||
            location.district ||
            location.state ||
            "your location";


        let result =
            "🌤️ DETAILED WEATHER\n\n";


        result +=
            "📍 Location: " +
            place +
            "\n";


        if (location.district) {

            result +=
                "District: " +
                location.district +
                "\n";
        }


        if (location.state) {

            result +=
                "State: " +
                location.state +
                "\n";
        }


        result +=
            "\n";


        // Current
        result +=
            "🌡️ Current Temperature: " +
            current.temperature_2m +
            " °C\n";


        result +=
            "🌡️ Feels Like: " +
            current.apparent_temperature +
            " °C\n";


        result +=
            "☁️ Condition: " +
            weatherDescription(
                current.weather_code
            ) +
            "\n";


        result +=
            "💧 Humidity: " +
            current.relative_humidity_2m +
            " %\n";


        result +=
            "☁️ Cloud Cover: " +
            current.cloud_cover +
            " %\n";


        result +=
            "🌧️ Precipitation: " +
            current.precipitation +
            " mm\n";


        result +=
            "🌧️ Rain: " +
            current.rain +
            " mm\n";


        result +=
            "💨 Wind: " +
            current.wind_speed_10m +
            " km/h\n";


        result +=
            "💨 Wind Gusts: " +
            current.wind_gusts_10m +
            " km/h\n";


        result +=
            "🧭 Wind Direction: " +
            current.wind_direction_10m +
            "°\n";


        result +=
            "Pressure: " +
            current.surface_pressure +
            " hPa\n";


        // Tomorrow / Daily
        if (
            daily.temperature_2m_max &&
            daily.temperature_2m_min
        ) {

            result +=
                "\n📅 TODAY FORECAST\n";


            result +=
                "Min: " +
                daily.temperature_2m_min[0] +
                " °C\n";


            result +=
                "Max: " +
                daily.temperature_2m_max[0] +
                " °C\n";


            result +=
                "Feels Like Max: " +
                daily.apparent_temperature_max[0] +
                " °C\n";


            result +=
                "Rain Probability: " +
                (
                    daily.precipitation_probability_max
                        ? daily.precipitation_probability_max[0]
                        : 0
                ) +
                " %\n";


            result +=
                "Rain Amount: " +
                (
                    daily.precipitation_sum
                        ? daily.precipitation_sum[0]
                        : 0
                ) +
                " mm\n";


            result +=
                "Maximum Wind: " +
                (
                    daily.wind_speed_10m_max
                        ? daily.wind_speed_10m_max[0]
                        : 0
                ) +
                " km/h\n";
        }


        if (
            daily.sunrise &&
            daily.sunset
        ) {

            result +=
                "\n☀️ Sunrise: " +
                daily.sunrise[0] +
                "\n";


            result +=
                "🌇 Sunset: " +
                daily.sunset[0] +
                "\n";
        }


        result +=
            "\nLocation source: " +
            (
                location.source ||
                "Location service"
            );


        return result;

    } catch (error) {

        console.error(
            "Weather error:",
            error
        );

        return (
            "🌤️ Weather data could not be loaded right now, Boss."
        );
    }
}


// =====================================================
// 13. TOOL HANDLER
// =====================================================

async function handleTools(text) {

    const original =
        String(text || "").trim();

    const t =
        original.toLowerCase();


    // =================================================
    // TOOL 1 - TIME
    // =================================================

    if (
        /\b(time|current time|what time)\b/i
            .test(t)
    ) {

        return (
            "⏰ Current time: " +
            new Date().toLocaleTimeString()
        );
    }


    // =================================================
    // TOOL 2 - LOCATION
    // =================================================

    if (
        /\b(where am i|my location|current location|location|where i am)\b/i
            .test(t)
    ) {

        return await getLocationInfo();
    }


    // =================================================
    // TOOL 3 - WEATHER
    // =================================================

    if (
        /\b(weather|temperature|rain|forecast|climate|hot|cold)\b/i
            .test(t)
    ) {

        return await getDetailedWeather();
    }


    // =================================================
    // TOOL 4 - DATE
    // =================================================

    if (
        /\b(date|today's date|todays date|what date)\b/i
            .test(t)
    ) {

        return (
            "📅 Today is " +
            new Date().toLocaleDateString(
                undefined,
                {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                }
            )
        );
    }


    // =================================================
    // TOOL 5 - TIMER
    // =================================================

    const timerMatch =
        t.match(
            /(?:timer|set timer)\s+(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)?/i
        );

    if (timerMatch) {

        const value =
            Number(timerMatch[1]);

        const unit =
            (timerMatch[2] || "seconds")
                .toLowerCase();

        let milliseconds =
            value * 1000;


        if (
            unit.startsWith("minute") ||
            unit.startsWith("min")
        ) {

            milliseconds =
                value * 60 * 1000;
        }


        if (
            unit.startsWith("hour") ||
            unit.startsWith("hr")
        ) {

            milliseconds =
                value * 60 * 60 * 1000;
        }


        setTimeout(() => {

            alert(
                "⏰ JARVIS TIMER FINISHED"
            );

            speak(
                "Boss, your timer is finished."
            );

        }, milliseconds);


        return (
            "⏰ Timer started for " +
            value +
            " " +
            unit +
            "."
        );
    }


    // =================================================
    // TOOL 6 - YOUTUBE
    // =================================================

    if (
        t.startsWith("youtube ")
    ) {

        const query =
            original.substring(8).trim();

        if (!query) {
            return "Please tell me what to search on YouTube.";
        }


        const url =
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query);

        window.open(url, "_blank");

        return (
            "▶️ Searching YouTube for: " +
            query
        );
    }


    // =================================================
    // TOOL 7 - CALCULATOR
    // =================================================

    if (
        t.startsWith("calculate ") ||
        t.startsWith("calc ")
    ) {

        let expression =
            original
                .replace(/^calculate\s+/i, "")
                .replace(/^calc\s+/i, "")
                .trim();


        // Only allow mathematical characters
        if (
            !/^[0-9+\-*/().%\s]+$/.test(
                expression
            )
        ) {

            return (
                "Calculator accepts numbers and + - * / % ( )."
            );
        }


        try {

            const result =
                Function(
                    '"use strict"; return (' +
                    expression +
                    ')'
                )();


            return (
                "🔢 Result: " +
                result
            );

        } catch {

            return (
                "❌ I could not calculate that expression."
            );
        }
    }


    // =================================================
    // TOOL 8 - OPEN WEBSITE
    // =================================================

    if (
        t.startsWith("open website ") ||
        t.startsWith("open site ")
    ) {

        let site =
            original
                .replace(/^open website\s+/i, "")
                .replace(/^open site\s+/i, "")
                .trim();


        if (!site) {
            return "Tell me the website name.";
        }


        if (
            !site.startsWith("http://") &&
            !site.startsWith("https://")
        ) {

            site =
                "https://" +
                site;
        }


        window.open(
            site,
            "_blank"
        );


        return (
            "🌐 Opening " +
            site
        );
    }


    // =================================================
    // TOOL 9 - GOOGLE SEARCH
    // =================================================

    if (
        t.startsWith("google ") ||
        t.startsWith("search google ") ||
        t.startsWith("search ")
    ) {

        let query =
            original
                .replace(/^search google\s+/i, "")
                .replace(/^google\s+/i, "")
                .replace(/^search\s+/i, "")
                .trim();


        if (!query) {
            return "Tell me what you want to search.";
        }


        const url =
            "https://www.google.com/search?q=" +
            encodeURIComponent(query);


        window.open(
            url,
            "_blank"
        );


        return (
            "🔎 Searching Google for: " +
            query
        );
    }


    // =================================================
    // TOOL 10 - TRANSLATE
    // =================================================

    if (
        t.startsWith("translate ")
    ) {

        let query =
            original
                .replace(/^translate\s+/i, "")
                .trim();


        if (!query) {
            return "Tell me what you want me to translate.";
        }


        try {

            const url =
                "https://api.mymemory.translated.net/get" +
                "?q=" +
                encodeURIComponent(query) +
                "&langpair=en|te";


            const response =
                await fetch(url);


            const data =
                await response.json();


            const translation =
                data?.responseData?.translatedText;


            if (!translation) {

                return (
                    "Translation is unavailable right now."
                );
            }


            return (
                "🌐 Telugu Translation:\n" +
                translation
            );

        } catch {

            return (
                "Translation service is unavailable right now."
            );
        }
    }


    // =================================================
    // TOOL 11 - STOPWATCH
    // =================================================

    if (
        t.includes("start stopwatch")
    ) {

        if (
            window.jarvisStopwatchStart
        ) {

            return (
                "⏱️ Stopwatch is already running."
            );
        }


        window.jarvisStopwatchStart =
            Date.now();


        return (
            "⏱️ Stopwatch started."
        );
    }


    if (
        t.includes("stop stopwatch") ||
        t.includes("stop watch")
    ) {

        if (
            !window.jarvisStopwatchStart
        ) {

            return (
                "⏱️ Stopwatch is not running."
            );
        }


        const elapsed =
            Date.now() -
            window.jarvisStopwatchStart;


        window.jarvisStopwatchStart =
            null;


        const seconds =
            Math.floor(
                elapsed / 1000
            );


        return (
            "⏱️ Stopwatch stopped.\n" +
            "Elapsed time: " +
            seconds +
            " seconds."
        );
    }


    if (
        t.includes("stopwatch")
    ) {

        if (
            !window.jarvisStopwatchStart
        ) {

            return (
                "⏱️ Stopwatch is not running."
            );
        }


        const elapsed =
            Date.now() -
            window.jarvisStopwatchStart;


        const seconds =
            Math.floor(
                elapsed / 1000
            );


        return (
            "⏱️ Stopwatch: " +
            seconds +
            " seconds."
        );
    }


    // =================================================
    // TOOL 12 - SAVE NOTE
    // =================================================

    if (
        t.startsWith("save note ")
    ) {

        const note =
            original
                .replace(/^save note\s+/i, "")
                .trim();


        if (!note) {

            return (
                "Tell me what note you want to save."
            );
        }


        const notes =
            JSON.parse(
                localStorage.getItem(
                    "jarvis_notes"
                ) || "[]"
            );


        notes.push({
            text: note,
            time:
                new Date().toLocaleString()
        });


        localStorage.setItem(
            "jarvis_notes",
            JSON.stringify(notes)
        );


        return (
            "📝 Note saved successfully."
        );
    }


    // =================================================
    // TOOL 13 - SHOW NOTES
    // =================================================

    if (
        t.includes("show notes") ||
        t.includes("my notes") ||
        t.includes("show my notes")
    ) {

        const notes =
            JSON.parse(
                localStorage.getItem(
                    "jarvis_notes"
                ) || "[]"
            );


        if (!notes.length) {

            return (
                "📝 You don't have any saved notes."
            );
        }


        let result =
            "📝 YOUR NOTES\n\n";


        notes.forEach(
            (note, index) => {

                result +=
                    (
                        index + 1
                    ) +
                    ". " +
                    note.text +
                    "\n";

                result +=
                    "   " +
                    note.time +
                    "\n\n";
            }
        );


        return result;
    }


    // =================================================
    // TOOL 14 - SYSTEM INFO
    // =================================================

    if (
        t.includes("system info") ||
        t.includes("system information") ||
        t.includes("my system")
    ) {

        return (
            "💻 SYSTEM INFORMATION\n\n" +

            "Platform: " +
            navigator.platform +
            "\n" +

            "Browser: " +
            navigator.userAgent +
            "\n" +

            "Language: " +
            navigator.language +
            "\n" +

            "Online: " +
            (
                navigator.onLine
                    ? "Yes"
                    : "No"
            ) +
            "\n" +

            "CPU Cores: " +
            (
                navigator.hardwareConcurrency ||
                "Unknown"
            ) +
            "\n" +

            "Screen: " +
            screen.width +
            " × " +
            screen.height
        );
    }


    // =================================================
    // TOOL 15 - PUBLIC IP
    // =================================================

    if (
        t.includes("my ip") ||
        t.includes("public ip") ||
        t.includes("ip address")
    ) {

        try {

            const response =
                await fetch(
                    "https://api.ipify.org?format=json",
                    {
                        cache: "no-store"
                    }
                );


            const data =
                await response.json();


            return (
                "🌐 Your public IP address is: " +
                data.ip
            );

        } catch {

            return (
                "Public IP service is unavailable right now."
            );
        }
    }


    // =================================================
    // TOOL 16 - RANDOM NUMBER
    // =================================================

    const randomMatch =
        t.match(
            /random number(?: between)?\s+(\d+)\s+(?:and|to)\s+(\d+)/i
        );


    if (randomMatch) {

        const min =
            Number(randomMatch[1]);

        const max =
            Number(randomMatch[2]);


        const random =
            Math.floor(
                Math.random() *
                (max - min + 1)
            ) +
            min;


        return (
            "🎲 Random number: " +
            random
        );
    }


    // =================================================
    // NO TOOL MATCH
    // =================================================

    return null;
}


// =====================================================
// 14. GEMINI API
// =====================================================

async function callGemini(
    userText,
    imageBase64 = null
) {

    if (!API_KEY) {

        return (
            "Gemini API key is not configured."
        );
    }


    const contents = [];


    // Add previous memory
    memory.forEach(item => {

        contents.push({
            role:
                item.role === "model"
                    ? "model"
                    : "user",

            parts: [
                {
                    text:
                        item.text
                }
            ]
        });

    });


    // Current message
    const parts = [
        {
            text: userText
        }
    ];


    // Image
    if (imageBase64) {

        parts.push({
            inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
            }
        });
    }


    contents.push({
        role: "user",
        parts: parts
    });


    const body = {

        system_instruction: {
            parts: [
                {
                    text:
                        `
You are J.A.R.V.I.S, a smart personal AI assistant.

Call the user "Boss" when appropriate.

Be helpful, concise and intelligent.

The browser application provides tools for:
- Time
- Location
- Weather
- Date
- Timer
- YouTube
- Calculator
- Website
- Google Search
- Translation
- Stopwatch
- Notes
- System information
- Public IP
- Random numbers

If a tool result is already provided, use that information directly.

Do not invent location, weather, IP or system information.

For normal questions, answer naturally.

User language may be Telugu, English or Telugu-English mixed.
Reply in the same language style as the user when practical.
                        `
                }
            ]
        },

        contents: contents
    };


    let lastError = null;


    for (
        const model of MODELS
    ) {

        try {

            const url =
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                model +
                ":generateContent?key=" +
                encodeURIComponent(API_KEY);


            const response =
                await fetch(
                    url,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(body)
                    }
                );


            if (!response.ok) {

                const errorText =
                    await response.text();

                lastError =
                    new Error(
                        model +
                        " : " +
                        errorText
                    );

                continue;
            }


            const data =
                await response.json();


            const answer =
                data?.candidates?.[0]?.content?.parts
                    ?.map(
                        p => p.text || ""
                    )
                    .join("")
                    .trim();


            if (answer) {

                return answer;
            }

        } catch (error) {

            lastError =
                error;
        }
    }


    console.error(
        "Gemini error:",
        lastError
    );


    return (
        "Sorry Boss, Gemini is not responding right now."
    );
}


// =====================================================
// 15. MAIN AI FUNCTION
// =====================================================

async function askGemini(text, imageBase64 = null) {

    const userText =
        String(text || "").trim();


    if (!userText && !imageBase64) {
        return;
    }


    // =================================================
    // CHECK TOOLS FIRST
    // =================================================

    if (!imageBase64) {

        const toolResult =
            await handleTools(userText);


        if (toolResult) {

            add(
                toolResult,
                "JARVIS"
            );


            saveMemory(
                "model",
                toolResult
            );


            speak(
                toolResult
            );


            return;
        }
    }


    // =================================================
    // GEMINI
    // =================================================

    const answer =
        await callGemini(
            userText,
            imageBase64
        );


    add(
        answer,
        "JARVIS"
    );


    saveMemory(
        "user",
        userText
    );


    saveMemory(
        "model",
        answer
    );


    speak(answer);
}


// =====================================================
// 16. SEND BUTTON
// =====================================================

if (sendBtn) {

    sendBtn.addEventListener(
        "click",
        async () => {

            const text =
                msg.value.trim();


            if (!text) return;


            add(
                text,
                "YOU"
            );


            msg.value = "";


            await askGemini(
                text
            );
        }
    );
}


// =====================================================
// 17. ENTER KEY
// =====================================================

if (msg) {

    msg.addEventListener(
        "keydown",
        async e => {

            if (
                e.key === "Enter" &&
                !e.shiftKey
            ) {

                e.preventDefault();


                const text =
                    msg.value.trim();


                if (!text) return;


                add(
                    text,
                    "YOU"
                );


                msg.value = "";


                await askGemini(
                    text
                );
            }
        }
    );
}


// =====================================================
// 18. CLEAR MEMORY
// =====================================================

if (clearBtn) {

    clearBtn.addEventListener(
        "click",
        () => {

            memory = [];

            localStorage.removeItem(
                "jarvis_memory"
            );


            if (chat) {
                chat.innerHTML = "";
            }


            add(
                "Memory cleared, Boss.",
                "JARVIS"
            );
        }
    );
}


// =====================================================
// 19. VOICE RECOGNITION
// =====================================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (
    SpeechRecognition &&
    micBtn
) {

    const recognition =
        new SpeechRecognition();


    recognition.lang =
        "en-IN";

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    recognition.onstart =
        () => {

            micBtn.classList.add(
                "listening"
            );
        };


    recognition.onend =
        () => {

            micBtn.classList.remove(
                "listening"
            );
        };


    recognition.onerror =
        error => {

            console.log(
                "Speech recognition:",
                error.error
            );

        };


    recognition.onresult =
        async event => {

            const text =
                event.results[0][0].transcript;


            if (!text) return;


            add(
                text,
                "YOU"
            );


            await askGemini(
                text
            );
        };


    micBtn.addEventListener(
        "click",
        () => {

            try {

                recognition.start();

            } catch (error) {

                console.log(
                    "Recognition start:",
                    error
                );
            }
        }
    );

} else if (micBtn) {

    micBtn.addEventListener(
        "click",
        () => {

            speak(
                "Voice recognition is not available in this browser."
            );
        }
    );
}


// =====================================================
// 20. CAMERA / IMAGE INPUT
// =====================================================

if (camBtn && imgInput) {

    camBtn.addEventListener(
        "click",
        () => {

            imgInput.click();
        }
    );


    imgInput.addEventListener(
        "change",
        event => {

            const file =
                event.target.files?.[0];


            if (!file) return;


            const reader =
                new FileReader();


            reader.onload =
                async () => {

                    const base64 =
                        reader.result
                            .split(",")[1];


                    add(
                        "📷 Image received. Analyzing...",
                        "YOU"
                    );


                    await askGemini(
                        "Analyze this image in detail. Tell me what you see.",
                        base64
                    );
                };


            reader.readAsDataURL(file);
        }
    );
}


// =====================================================
// 21. STARTUP MESSAGE
// =====================================================

window.addEventListener(
    "load",
    () => {

        add(
            "J.A.R.V.I.S online, Boss. All systems ready.",
            "JARVIS"
        );
    }
);
