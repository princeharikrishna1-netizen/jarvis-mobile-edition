// =====================================================
// J.A.R.V.I.S - ANDROID AI CORE
// Gemini + Memory + Telugu/English + Voice + Vision
// Location + Weather + Tools + Android Apps
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
// 3. DOM
// =====================================================

const chat = document.getElementById("chat");
const msg = document.getElementById("msg");
const micBtn = document.getElementById("mic-btn");
const clearBtn = document.getElementById("clear-btn");
const camBtn = document.getElementById("cam-btn");
const imgInput = document.getElementById("img-input");
const sendBtn = document.getElementById("send");


// =====================================================
// 4. LANGUAGE MODE
// =====================================================

let jarvisLanguage =
    localStorage.getItem("jarvis_language") || "auto";


function setJarvisLanguage(language) {

    if (
        language !== "auto" &&
        language !== "te" &&
        language !== "en"
    ) {
        return;
    }

    jarvisLanguage = language;

    localStorage.setItem(
        "jarvis_language",
        language
    );
}


// =====================================================
// DETECT RESPONSE LANGUAGE
// =====================================================

function detectLanguage(text) {

    const value = String(text || "");

    if (jarvisLanguage === "te") {
        return "te";
    }

    if (jarvisLanguage === "en") {
        return "en";
    }

    // Telugu Unicode
    const telugu =
        (value.match(/[\u0C00-\u0C7F]/g) || []).length;

    const english =
        (value.match(/[A-Za-z]/g) || []).length;

    if (telugu > 0) {
        return "te";
    }

    if (english > 0) {
        return "en";
    }

    return "en";
}


// =====================================================
// 5. MEMORY
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
// 6. CHAT UI
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
// 7. VOICE
// =====================================================

function getBestVoice(language) {

    if (!("speechSynthesis" in window)) {
        return null;
    }

    const voices =
        speechSynthesis.getVoices();

    if (!voices.length) {
        return null;
    }

    if (language === "te") {

        return (
            voices.find(v =>
                v.lang.toLowerCase() === "te-in"
            ) ||

            voices.find(v =>
                v.lang.toLowerCase().startsWith("te")
            )
        ) || null;
    }


    return (
        voices.find(v =>
            v.lang.toLowerCase() === "en-in"
        ) ||

        voices.find(v =>
            v.lang.toLowerCase() === "en-us"
        ) ||

        voices.find(v =>
            v.lang.toLowerCase().startsWith("en")
        )
    ) || null;
}


function speak(text) {

    if (!("speechSynthesis" in window)) {
        return;
    }

    if (!text) return;

    try {

        speechSynthesis.cancel();

        const cleanText =
            String(text)
                .replace(/[*_#`]/g, "")
                .replace(
                    /https?:\/\/\S+/g,
                    ""
                )
                .replace(
                    /[📍🌤️🌡️💧💨☁️🌧️❄️📅⏰🔢📝🎤📷]/gu,
                    ""
                )
                .trim();

        if (!cleanText) return;

        const language =
            detectLanguage(cleanText);

        const utterance =
            new SpeechSynthesisUtterance(
                cleanText
            );


        if (language === "te") {

            utterance.lang = "te-IN";

            const voice =
                getBestVoice("te");

            if (voice) {
                utterance.voice = voice;
            }

            utterance.rate = 0.92;
            utterance.pitch = 1;

        } else {

            utterance.lang = "en-IN";

            const voice =
                getBestVoice("en");

            if (voice) {
                utterance.voice = voice;
            }

            utterance.rate = 0.95;
            utterance.pitch = 1;
        }

        utterance.volume = 1;

        speechSynthesis.speak(
            utterance
        );

    } catch (error) {

        console.error(
            "Speech error:",
            error
        );
    }
}


if ("speechSynthesis" in window) {

    speechSynthesis.onvoiceschanged =
        () => {

            console.log(
                "JARVIS voices loaded:",
                speechSynthesis
                    .getVoices()
                    .length
            );
        };
}


// =====================================================
// 8. WEATHER DESCRIPTION
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
// 9. GPS
// =====================================================

function getBrowserLocation() {

    return new Promise(resolve => {

        if (!navigator.geolocation) {
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(

            position => {

                resolve({

                    lat:
                        position.coords.latitude,

                    lon:
                        position.coords.longitude,

                    accuracy:
                        Math.round(
                            position.coords.accuracy || 0
                        ),

                    source:
                        "GPS / Browser"
                });
            },

            () => {

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
// 10. NETWORK LOCATION
// =====================================================

async function getNetworkLocation() {

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

                    lat:
                        Number(data.latitude),

                    lon:
                        Number(data.longitude),

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
            "Location API 1 failed"
        );
    }


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
            "Location API 2 failed"
        );
    }

    return null;
}


// =====================================================
// 11. BEST LOCATION
// =====================================================

async function getBestLocation() {

    let location =
        await getBrowserLocation();

    if (!location) {

        location =
            await getNetworkLocation();
    }

    if (!location) {
        return null;
    }


    try {

        const url =
            "https://nominatim.openstreetmap.org/reverse" +
            "?format=jsonv2" +
            "&lat=" +
            encodeURIComponent(location.lat) +
            "&lon=" +
            encodeURIComponent(location.lon) +
            "&zoom=18" +
            "&addressdetails=1";

        const response =
            await fetch(url, {
                headers: {
                    Accept:
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
// 12. LOCATION INFO
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
        location.lon.toFixed(6);

    return result;
}


// =====================================================
// 13. WEATHER
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
            "precipitation",
            "rain",
            "weather_code",
            "cloud_cover",
            "surface_pressure",
            "wind_speed_10m",
            "wind_direction_10m",
            "wind_gusts_10m"
        ].join(",") +

        "&daily=" +
        [
            "weather_code",
            "temperature_2m_max",
            "temperature_2m_min",
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
            "\n\n";

        result +=
            "🌡️ Temperature: " +
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
            "🌧️ Rain: " +
            current.rain +
            " mm\n";

        result +=
            "💨 Wind: " +
            current.wind_speed_10m +
            " km/h\n";

        result +=
            "🧭 Wind Direction: " +
            current.wind_direction_10m +
            "°\n";

        result +=
            "Pressure: " +
            current.surface_pressure +
            " hPa\n";


        if (
            daily.temperature_2m_min &&
            daily.temperature_2m_max
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
                "Rain Probability: " +
                (
                    daily.precipitation_probability_max?.[0] ||
                    0
                ) +
                " %\n";
        }

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
// 14. ANDROID APP OPENING
// =====================================================

function openAndroidApp(app) {

    const apps = {

        youtube: {
            intent:
                "intent://www.youtube.com/#Intent;package=com.google.android.youtube;scheme=https;end",
            fallback:
                "https://www.youtube.com/"
        },

        chrome: {
            intent:
                "intent://#Intent;package=com.android.chrome;scheme=https;end",
            fallback:
                "https://www.google.com/"
        },

        camera: {
            intent:
                "intent://#Intent;action=android.media.action.IMAGE_CAPTURE;end",
            fallback:
                "https://www.google.com/search?q=android+camera"
        },

        whatsapp: {
            intent:
                "intent://send/#Intent;package=com.whatsapp;scheme=whatsapp;end",
            fallback:
                "https://web.whatsapp.com/"
        },

        telegram: {
            intent:
                "intent://#Intent;package=org.telegram.messenger;scheme=tg;end",
            fallback:
                "https://web.telegram.org/"
        },

        instagram: {
            intent:
                "intent://instagram.com/#Intent;package=com.instagram.android;scheme=https;end",
            fallback:
                "https://www.instagram.com/"
        },

        facebook: {
            intent:
                "intent://facebook.com/#Intent;package=com.facebook.katana;scheme=https;end",
            fallback:
                "https://www.facebook.com/"
        },

        gmail: {
            intent:
                "intent://#Intent;package=com.google.android.gm;scheme=mailto;end",
            fallback:
                "https://mail.google.com/"
        },

        maps: {
            intent:
                "geo:0,0?q=",
            fallback:
                "https://maps.google.com/"
        },

        settings: {
            intent:
                "intent://#Intent;action=android.settings.SETTINGS;end",
            fallback:
                "https://www.google.com/search?q=Android+settings"
        },

        wifi: {
            intent:
                "intent://#Intent;action=android.settings.WIFI_SETTINGS;end",
            fallback:
                "https://www.google.com/search?q=Android+WiFi+settings"
        },

        bluetooth: {
            intent:
                "intent://#Intent;action=android.settings.BLUETOOTH_SETTINGS;end",
            fallback:
                "https://www.google.com/search?q=Android+Bluetooth+settings"
        },

        location: {
            intent:
                "intent://#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end",
            fallback:
                "https://www.google.com/search?q=Android+location+settings"
        },

        calculator: {
            intent:
                "intent://#Intent;package=com.google.android.calculator;end",
            fallback:
                "https://www.google.com/search?q=calculator"
        }
    };


    const data =
        apps[app];

    if (!data) {
        return false;
    }


    try {

        window.location.href =
            data.intent;

        setTimeout(() => {

            if (data.fallback) {
                window.open(
                    data.fallback,
                    "_blank"
                );
            }

        }, 1200);

        return true;

    } catch (error) {

        if (data.fallback) {

            window.open(
                data.fallback,
                "_blank"
            );
        }

        return true;
    }
}


// =====================================================
// 15. ANDROID APP COMMANDS
// =====================================================

function handleAndroidApps(text) {

    const t =
        String(text || "")
            .toLowerCase()
            .trim();


    const commands = [

        {
            names: [
                "open youtube",
                "youtube open",
                "youtube kholo",
                "youtube తెరువు"
            ],
            app: "youtube",
            response:
                "▶️ YouTube opening, Boss."
        },

        {
            names: [
                "open chrome",
                "chrome open"
            ],
            app: "chrome",
            response:
                "🌐 Chrome opening, Boss."
        },

        {
            names: [
                "open camera",
                "camera open",
                "camera kholo"
            ],
            app: "camera",
            response:
                "📷 Camera opening, Boss."
        },

        {
            names: [
                "open whatsapp",
                "whatsapp open",
                "whatsapp kholo"
            ],
            app: "whatsapp",
            response:
                "💬 WhatsApp opening, Boss."
        },

        {
            names: [
                "open telegram",
                "telegram open"
            ],
            app: "telegram",
            response:
                "💬 Telegram opening, Boss."
        },

        {
            names: [
                "open instagram",
                "instagram open"
            ],
            app: "instagram",
            response:
                "📸 Instagram opening, Boss."
        },

        {
            names: [
                "open facebook",
                "facebook open"
            ],
            app: "facebook",
            response:
                "📘 Facebook opening, Boss."
        },

        {
            names: [
                "open gmail",
                "gmail open"
            ],
            app: "gmail",
            response:
                "📧 Gmail opening, Boss."
        },

        {
            names: [
                "open maps",
                "maps open",
                "open google maps"
            ],
            app: "maps",
            response:
                "🗺️ Google Maps opening, Boss."
        },

        {
            names: [
                "open settings",
                "settings open"
            ],
            app: "settings",
            response:
                "⚙️ Settings opening, Boss."
        },

        {
            names: [
                "open wifi settings",
                "wifi settings",
                "wifi open"
            ],
            app: "wifi",
            response:
                "📶 Wi-Fi settings opening, Boss."
        },

        {
            names: [
                "open bluetooth",
                "bluetooth settings",
                "bluetooth open"
            ],
            app: "bluetooth",
            response:
                "🔵 Bluetooth settings opening, Boss."
        },

        {
            names: [
                "open location settings",
                "location settings"
            ],
            app: "location",
            response:
                "📍 Location settings opening, Boss."
        },

        {
            names: [
                "open calculator",
                "calculator open"
            ],
            app: "calculator",
            response:
                "🔢 Calculator opening, Boss."
        }
    ];


    for (const command of commands) {

        if (
            command.names.some(
                name => t.includes(name)
            )
        ) {

            openAndroidApp(
                command.app
            );

            return command.response;
        }
    }


    return null;
}


// =====================================================
// 16. TOOLS
// =====================================================

async function handleTools(text) {

    const original =
        String(text || "").trim();

    const t =
        original.toLowerCase();


    // -----------------------------------------------
    // LANGUAGE
    // -----------------------------------------------

    if (
        t.includes("telugu lo matladu") ||
        t.includes("telugu lo speak") ||
        t.includes("speak telugu") ||
        t.includes("telugu mode")
    ) {

        setJarvisLanguage("te");

        return "సరే Boss. ఇకపై నేను తెలుగులో మాట్లాడుతాను.";
    }


    if (
        t.includes("english lo matladu") ||
        t.includes("speak english") ||
        t.includes("english mode")
    ) {

        setJarvisLanguage("en");

        return "Okay Boss. I will speak in English from now on.";
    }


    if (
        t === "auto language" ||
        t === "automatic language"
    ) {

        setJarvisLanguage("auto");

        return "సరే Boss. ఇకపై నేను language automatic-ga detect చేస్తాను.";
    }


    // -----------------------------------------------
    // TIME
    // -----------------------------------------------

    if (
        /\b(time|current time|what time)\b/i.test(t) ||
        t.includes("time cheppu")
    ) {

        return (
            "⏰ Current time: " +
            new Date().toLocaleTimeString()
        );
    }


    // -----------------------------------------------
    // DATE
    // -----------------------------------------------

    if (
        /\b(date|today's date|todays date|what date)\b/i.test(t) ||
        t.includes("date cheppu")
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


    // -----------------------------------------------
    // LOCATION
    // -----------------------------------------------

    if (
        /\b(where am i|my location|current location|location)\b/i.test(t) ||
        t.includes("where unna") ||
        t.includes("location cheppu")
    ) {

        return await getLocationInfo();
    }


    // -----------------------------------------------
    // WEATHER
    // -----------------------------------------------

    if (
        /\b(weather|temperature|rain|forecast|climate|hot|cold)\b/i.test(t) ||
        t.includes("weather cheppu") ||
        t.includes("weather ela undi")
    ) {

        return await getDetailedWeather();
    }


    // -----------------------------------------------
    // TIMER
    // -----------------------------------------------

    const timerMatch =
        t.match(
            /(?:set\s+timer|timer)\s+(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)?/i
        );


    if (timerMatch) {

        const value =
            Number(timerMatch[1]);

        const unit =
            (
                timerMatch[2] ||
                "seconds"
            ).toLowerCase();

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


    // -----------------------------------------------
    // YOUTUBE
    // -----------------------------------------------

    if (
        t.startsWith("youtube ")
    ) {

        const query =
            original
                .substring(8)
                .trim();

        if (!query) {
            return null;
        }

        const url =
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query);

        window.open(
            url,
            "_blank"
        );

        return (
            "▶️ Searching YouTube for: " +
            query
        );
    }


    // -----------------------------------------------
    // CALCULATOR
    // -----------------------------------------------

    if (
        t.startsWith("calculate ") ||
        t.startsWith("calc ")
    ) {

        const expression =
            original
                .replace(
                    /^calculate\s+/i,
                    ""
                )
                .replace(
                    /^calc\s+/i,
                    ""
                )
                .trim();


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


    // -----------------------------------------------
    // OPEN WEBSITE
    // -----------------------------------------------

    if (
        t.startsWith("open website ") ||
        t.startsWith("open site ")
    ) {

        let site =
            original
                .replace(
                    /^open website\s+/i,
                    ""
                )
                .replace(
                    /^open site\s+/i,
                    ""
                )
                .trim();


        if (!site) {
            return null;
        }


        if (
            !site.startsWith("http://") &&
            !site.startsWith("https://")
        ) {

            site =
                "https://" + site;
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


    // -----------------------------------------------
    // GOOGLE SEARCH
    // -----------------------------------------------

    if (
        t.startsWith("google ") ||
        t.startsWith("search google ") ||
        t.startsWith("search ")
    ) {

        let query =
            original
                .replace(
                    /^search google\s+/i,
                    ""
                )
                .replace(
                    /^google\s+/i,
                    ""
                )
                .replace(
                    /^search\s+/i,
                    ""
                )
                .trim();


        if (!query) {
            return null;
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


    // -----------------------------------------------
    // TRANSLATE
    // -----------------------------------------------

    if (
        t.startsWith("translate ")
    ) {

        const query =
            original
                .replace(
                    /^translate\s+/i,
                    ""
                )
                .trim();


        if (!query) {
            return null;
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


    // -----------------------------------------------
    // STOPWATCH
    // -----------------------------------------------

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


    // -----------------------------------------------
    // SAVE NOTE
    // -----------------------------------------------

    if (
        t.startsWith("save note ")
    ) {

        const note =
            original
                .replace(
                    /^save note\s+/i,
                    ""
                )
                .trim();


        if (!note) {
            return null;
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


    // -----------------------------------------------
    // SHOW NOTES
    // -----------------------------------------------

    if (
        t.includes("show notes") ||
        t.includes("my notes")
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
                    (index + 1) +
                    ". " +
                    note.text +
                    "\n" +
                    note.time +
                    "\n\n";
            }
        );


        return result;
    }


    // -----------------------------------------------
    // SYSTEM INFO
    // -----------------------------------------------

    if (
        t.includes("system info") ||
        t.includes("system information") ||
        t.includes("my system")
    ) {

        return (
            "📱 SYSTEM INFORMATION\n\n" +

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


    // -----------------------------------------------
    // PUBLIC IP
    // -----------------------------------------------

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


    // -----------------------------------------------
    // RANDOM NUMBER
    // -----------------------------------------------

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
            ) + min;


        return (
            "🎲 Random number: " +
            random
        );
    }


    return null;
}


// =====================================================
// 17. GEMINI
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


    memory.forEach(item => {

        contents.push({

            role:
                item.role === "model"
                    ? "model"
                    : "user",

            parts: [
                {
                    text: item.text
                }
            ]
        });
    });


    const parts = [
        {
            text: userText
        }
    ];


    if (imageBase64) {

        parts.push({

            inline_data: {

                mime_type:
                    "image/jpeg",

                data:
                    imageBase64
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
                    text: `
You are J.A.R.V.I.S, a smart personal AI assistant.

Call the user "Boss" naturally when appropriate.

You understand:
- English
- Telugu
- Telugu written using English letters
- Telugu-English mixed language

LANGUAGE RULES:

1. If the user writes Telugu script, reply in Telugu.

2. If the user writes English, reply in English.

3. If the user writes Telugu using English letters,
   such as:
   "naku weather cheppu"
   "youtube open cheyyi"
   "emi chestunnav"
   reply naturally in Telugu script.

4. If the user mixes Telugu and English,
   reply naturally using Telugu with necessary English technical words.

5. If the user says:
   "Telugu lo matladu"
   reply in Telugu.

6. If the user says:
   "Speak English"
   reply in English.

7. Keep normal answers conversational and reasonably short.

8. Do not invent location, weather, IP or device information.

9. If a tool result is provided, use that information.

10. You are running inside an Android browser-based J.A.R.V.I.S interface.

Be helpful, intelligent and natural.
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

                        method:
                            "POST",

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
                data?.candidates?.[0]
                    ?.content?.parts
                    ?.map(
                        p => p.text || ""
                    )
                    .join("")
                    .trim();


            if (answer) {
                return answer;
            }

        } catch (error) {

            lastError = error;
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
// 18. MAIN JARVIS
// =====================================================

async function askGemini(
    text,
    imageBase64 = null
) {

    const userText =
        String(text || "").trim();


    if (
        !userText &&
        !imageBase64
    ) {
        return;
    }


    // -----------------------------------------------
    // ANDROID APP COMMANDS
    // -----------------------------------------------

    if (!imageBase64) {

        const appResult =
            handleAndroidApps(
                userText
            );


        if (appResult) {

            add(
                appResult,
                "JARVIS"
            );

            saveMemory(
                "model",
                appResult
            );

            speak(
                appResult
            );

            return;
        }
    }


    // -----------------------------------------------
    // TOOLS
    // -----------------------------------------------

    if (!imageBase64) {

        const toolResult =
            await handleTools(
                userText
            );


        if (toolResult) {

            add(
                toolResult,
                "JARVIS"
            );

            saveMemory(
                "user",
                userText
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


    // -----------------------------------------------
    // GEMINI
    // -----------------------------------------------

    const answer =
        await callGemini(
            userText,
            imageBase64
        );


    add(
        answer,
        "JARVIS"
    );


    if (userText) {

        saveMemory(
            "user",
            userText
        );
    }


    saveMemory(
        "model",
        answer
    );


    speak(answer);
}


// =====================================================
// 19. SEND BUTTON
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
// 20. ENTER KEY
// =====================================================

if (msg) {

    msg.addEventListener(
        "keydown",
        async event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();


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
// 21. CLEAR MEMORY
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
// 22. VOICE RECOGNITION
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
                event.results[0][0]
                    .transcript;


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

                // Recognition language
                if (
                    jarvisLanguage === "te"
                ) {

                    recognition.lang =
                        "te-IN";

                } else {

                    recognition.lang =
                        "en-IN";
                }


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
// 23. CAMERA / IMAGE
// =====================================================

if (
    camBtn &&
    imgInput
) {

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


            reader.readAsDataURL(
                file
            );
        }
    );
}


// =====================================================
// 24. STARTUP
// =====================================================

window.addEventListener(
    "load",
    () => {

        add(
            "J.A.R.V.I.S online, Boss. Telugu + English systems ready.",
            "JARVIS"
        );
    }
);
