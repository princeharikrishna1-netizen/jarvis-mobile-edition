// =====================================================
// J.A.R.V.I.S
// COMPLETE SCRIPT
// Gemini + Memory + 5 Tools + Voice + Image
// =====================================================


// =====================================================
// 1. GEMINI API KEY
// =====================================================

let API_KEY =
    localStorage.getItem("jarvis_key");


if (!API_KEY) {

    API_KEY =
        prompt("Enter your Gemini API Key:");

    if (API_KEY) {

        API_KEY =
            API_KEY.trim();

        localStorage.setItem(
            "jarvis_key",
            API_KEY
        );
    }
}


// =====================================================
// 2. GEMINI MODEL
// =====================================================

const GEMINI_MODEL =
    "gemini-3.8-flash";


// =====================================================
// 3. MEMORY
// =====================================================

let MEMORY =
    JSON.parse(
        localStorage.getItem(
            "jarvis_memory"
        ) || "[]"
    );


function saveMemory() {

    localStorage.setItem(
        "jarvis_memory",
        JSON.stringify(MEMORY)
    );
}


// =====================================================
// 4. HTML ELEMENTS
// =====================================================

const chat =
    document.getElementById("chat");

const input =
    document.getElementById("msg");

const sendBtn =
    document.getElementById("send");

const micBtn =
    document.getElementById("mic-btn");

const camBtn =
    document.getElementById("cam-btn");

const clearBtn =
    document.getElementById("clear-btn");

const imgInput =
    document.getElementById("img-input");


// =====================================================
// 5. CHAT MESSAGE FUNCTION
// =====================================================

function add(text, type) {

    const div =
        document.createElement("div");

    div.className =
        "msg " + type;

    div.innerText =
        text;

    chat.appendChild(div);

    chat.scrollTop =
        chat.scrollHeight;

    return div;
}


// =====================================================
// 6. LOAD MEMORY
// =====================================================

MEMORY.forEach(message => {

    add(

        message.role === "user"
            ? "YOU: " + message.text
            : "J.A.R.V.I.S: " + message.text,

        message.role === "user"
            ? "user"
            : "ai"
    );

});


// =====================================================
// 7. GEMINI AI
// =====================================================

async function callGemini(prompt) {

    if (!API_KEY) {

        throw new Error(
            "Gemini API Key is missing."
        );
    }


    const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;


    // Last 12 messages
    const history =
        MEMORY.slice(-12);


    const contents = [];


    history.forEach(message => {

        contents.push({

            role:
                message.role === "user"
                    ? "user"
                    : "model",

            parts: [
                {
                    text:
                        message.text
                }
            ]
        });

    });


    // Current question
    contents.push({

        role: "user",

        parts: [
            {
                text: prompt
            }
        ]

    });


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
                    JSON.stringify({
                        contents:
                            contents
                    })
            }
        );


    const data =
        await response.json();


    console.log(
        "Gemini API Response:",
        data
    );


    if (!response.ok) {

        throw new Error(
            data?.error?.message ||
            "Gemini API request failed."
        );
    }


    if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
    ) {

        throw new Error(
            "Gemini returned no response."
        );
    }


    return (
        data
            .candidates[0]
            .content
            .parts
            .map(part => part.text || "")
            .join("")
    );
}


// =====================================================
// 8. ASK GEMINI
// =====================================================

async function askGemini(prompt) {

    const thinking =
        add(
            "J.A.R.V.I.S: Thinking...",
            "ai"
        );


    try {

        const reply =
            await callGemini(prompt);


        // Save user message
        MEMORY.push({

            role: "user",

            text: prompt

        });


        // Save AI reply
        MEMORY.push({

            role: "model",

            text: reply

        });


        // Keep memory manageable
        if (MEMORY.length > 50) {

            MEMORY =
                MEMORY.slice(-50);
        }


        saveMemory();


        thinking.innerText =
            "J.A.R.V.I.S: " +
            reply;


        speak(reply);


    } catch (error) {

        console.error(
            "Gemini Error:",
            error
        );


        thinking.innerText =
            "J.A.R.V.I.S: ERROR - " +
            error.message;
    }
}


// =====================================================
// 9. FIVE TOOLS
// =====================================================

async function handleTools(text) {

    const t =
        text.toLowerCase().trim();


    // =================================================
    // TOOL 1 - TIME
    // =================================================

    if (
        /\btime\b/.test(t) ||
        t.includes("టైమ్") ||
        t.includes("సమయం")
    ) {

        return (
            "The time is " +
            new Date().toLocaleTimeString() +
            ", Boss."
        );
    }


    // =================================================
    // TOOL 2 - WEATHER
    // =================================================

    if (
        t.includes("weather") ||
        t.includes("వాతావరణం")
    ) {

        return new Promise(resolve => {

            if (!navigator.geolocation) {

                resolve(
                    "Geolocation is not supported by this browser, Boss."
                );

                return;
            }


            navigator.geolocation.getCurrentPosition(

                async position => {

                    try {

                        const lat =
                            position.coords.latitude;

                        const lon =
                            position.coords.longitude;


                        const url =
                            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;


                        const response =
                            await fetch(url);


                        if (!response.ok) {

                            throw new Error(
                                "Weather request failed"
                            );
                        }


                        const data =
                            await response.json();


                        const temperature =
                            data.current_weather.temperature;


                        resolve(
                            `The current temperature is ${temperature}°C, Boss.`
                        );


                    } catch (error) {

                        console.error(
                            "Weather Error:",
                            error
                        );


                        resolve(
                            "Weather service error, Boss."
                        );
                    }

                },

                () => {

                    resolve(
                        "I need location permission for weather, Boss."
                    );

                }

            );

        });
    }


    // =================================================
    // TOOL 3 - TIMER
    // =================================================

    const timerMatch =
        t.match(
            /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
        );


    if (
        (
            t.includes("timer") ||
            t.includes("టైమర్")
        ) &&
        timerMatch
    ) {

        const amount =
            parseInt(
                timerMatch[1],
                10
            );


        const unit =
            timerMatch[2].toLowerCase();


        let factor;


        if (
            /^(hours?|hrs?)$/i.test(unit)
        ) {

            factor =
                60 * 60 * 1000;

        } else if (
            /^(seconds?|secs?)$/i.test(unit)
        ) {

            factor =
                1000;

        } else {

            factor =
                60 * 1000;
        }


        const duration =
            amount * factor;


        setTimeout(() => {

            const message =
                `Timer completed! ${amount} ${unit} finished, Boss.`;


            add(
                "J.A.R.V.I.S: " +
                message,
                "ai"
            );


            speak(message);

        }, duration);


        return (
            `Timer set for ${amount} ${unit}, Boss.`
        );
    }


    // =================================================
    // TOOL 4 - TRANSLATE
    // =================================================

    if (
        t.startsWith("translate ") ||
        t.startsWith("translate this ")
    ) {

        const q =
            text
                .replace(
                    /^translate (this )?/i,
                    ""
                )
                .trim();


        if (!q) {

            return (
                "Please tell me what you want me to translate, Boss."
            );
        }


        try {

            const url =
                "https://api.mymemory.translated.net/get?q=" +
                encodeURIComponent(q) +
                "&langpair=en|te";


            const response =
                await fetch(url);


            if (!response.ok) {

                throw new Error(
                    "Translation request failed"
                );
            }


            const data =
                await response.json();


            if (
                !data.responseData ||
                !data.responseData.translatedText
            ) {

                throw new Error(
                    "Translation unavailable"
                );
            }


            return (
                "In Telugu: " +
                data.responseData.translatedText
            );


        } catch (error) {

            console.error(
                "Translation Error:",
                error
            );


            return (
                "Translation service error, Boss."
            );
        }
    }


    // =================================================
    // TOOL 5 - YOUTUBE
    // =================================================

    if (
        t.startsWith("play ") ||
        t.startsWith("youtube ") ||
        t.startsWith("youtube search ")
    ) {

        let query =
            text;


        query =
            query.replace(
                /^youtube search /i,
                ""
            );


        query =
            query.replace(
                /^youtube /i,
                ""
            );


        query =
            query.replace(
                /^play /i,
                ""
            );


        query =
            query.trim();


        if (!query) {

            return (
                "Please tell me what you want to play on YouTube, Boss."
            );
        }


        const youtubeURL =
            "https://www.youtube.com/results?search_query=" +
            encodeURIComponent(query);


        window.open(
            youtubeURL,
            "_blank"
        );


        return (
            "Searching YouTube for " +
            query +
            ", Boss."
        );
    }


    // No tool matched
    return null;
}


// =====================================================
// 10. SEND BUTTON
// =====================================================

sendBtn.onclick =
    async function () {

        const text =
            input.value.trim();


        if (!text) {
            return;
        }


        add(
            "YOU: " + text,
            "user"
        );


        input.value =
            "";


        // Check tools first
        try {

            const toolResult =
                await handleTools(text);


            if (toolResult) {

                add(
                    "J.A.R.V.I.S: " +
                    toolResult,
                    "ai"
                );


                speak(
                    toolResult
                );


                return;
            }

        } catch (error) {

            console.error(
                "Tool Error:",
                error
            );
        }


        // No tool matched
        // Send to Gemini
        askGemini(text);
    };


// =====================================================
// 11. ENTER KEY
// =====================================================

input.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            sendBtn.click();
        }
    }
);


// =====================================================
// 12. VOICE INPUT
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
        "en-US";


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.onstart =
        function () {

            micBtn.innerText =
                "LISTENING...";
        };


    recognition.onresult =
        async function (event) {

            const text =
                event.results[0][0].transcript;


            add(
                "YOU: " + text,
                "user"
            );


            try {

                const toolResult =
                    await handleTools(text);


                if (toolResult) {

                    add(
                        "J.A.R.V.I.S: " +
                        toolResult,
                        "ai"
                    );


                    speak(
                        toolResult
                    );


                    return;
                }

            } catch (error) {

                console.error(
                    "Voice Tool Error:",
                    error
                );
            }


            askGemini(text);
        };


    recognition.onerror =
        function (event) {

            console.error(
                "Voice Error:",
                event.error
            );
        };


    recognition.onend =
        function () {

            micBtn.innerText =
                "🎙";
        };


    micBtn.onclick =
        function () {

            try {

                recognition.start();

            } catch (error) {

                console.log(
                    "Recognition already running."
                );
            }
        };

} else {

    if (micBtn) {

        micBtn.onclick =
            function () {

                alert(
                    "Voice recognition is not supported in this browser."
                );
            };
    }
}


// =====================================================
// 13. TEXT TO SPEECH
// =====================================================

let voices = [];


function loadVoices() {

    if (
        "speechSynthesis" in window
    ) {

        voices =
            speechSynthesis.getVoices();
    }
}


loadVoices();


if (
    "speechSynthesis" in window
) {

    speechSynthesis.onvoiceschanged =
        loadVoices;
}


function speak(text) {

    if (
        !("speechSynthesis" in window)
    ) {

        return;
    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.rate =
        1.05;


    utterance.pitch =
        0.85;


    const voice =
        voices.find(
            voice =>
                voice.lang &&
                voice.lang.startsWith("en")
        );


    if (voice) {

        utterance.voice =
            voice;
    }


    speechSynthesis.speak(
        utterance
    );
}


// =====================================================
// 14. IMAGE ANALYSIS
// =====================================================

if (
    camBtn &&
    imgInput
) {

    camBtn.onclick =
        function () {

            imgInput.click();
        };


    imgInput.onchange =
        function () {

            const file =
                imgInput.files[0];


            if (!file) {
                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                function () {

                    const base64 =
                        reader.result.split(",")[1];


                    const question =
                        input.value.trim() ||
                        "What do you see in this image? Describe it briefly.";


                    add(
                        "YOU: [IMAGE] " +
                        question,
                        "user"
                    );


                    input.value =
                        "";


                    askVision(
                        base64,
                        file.type,
                        question
                    );
                };


            reader.readAsDataURL(
                file
            );
        };
}


// =====================================================
// 15. IMAGE → GEMINI
// =====================================================

async function askVision(
    base64,
    mimeType,
    question
) {

    const thinking =
        add(
            "J.A.R.V.I.S: Analyzing image...",
            "ai"
        );


    try {

        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${API_KEY}`;


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
                        JSON.stringify({

                            contents: [

                                {

                                    role: "user",

                                    parts: [

                                        {
                                            text:
                                                question
                                        },

                                        {
                                            inline_data: {

                                                mime_type:
                                                    mimeType,

                                                data:
                                                    base64
                                            }
                                        }

                                    ]
                                }

                            ]

                        })
                }
            );


        const data =
            await response.json();


        console.log(
            "Vision Response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data?.error?.message ||
                "Image analysis failed."
            );
        }


        const reply =
            data
                .candidates[0]
                .content
                .parts
                .map(
                    part =>
                        part.text || ""
                )
                .join("");


        thinking.innerText =
            "J.A.R.V.I.S: " +
            reply;


        speak(reply);


    } catch (error) {

        console.error(
            "Vision Error:",
            error
        );


        thinking.innerText =
            "J.A.R.V.I.S: ERROR - " +
            error.message;
    }
}


// =====================================================
// 16. CLEAR MEMORY
// =====================================================

if (clearBtn) {

    clearBtn.onclick =
        function () {

            const confirmClear =
                confirm(
                    "Are you sure you want to clear J.A.R.V.I.S memory?"
                );


            if (!confirmClear) {
                return;
            }


            MEMORY = [];


            saveMemory();


            chat.innerHTML =
                "";


            add(
                "SYSTEM: Memory cleared.",
                "ai"
            );
        };
}


// =====================================================
// 17. STARTUP
// =====================================================

setTimeout(
    function () {

        if (
            MEMORY.length === 0
        ) {

            add(
                "J.A.R.V.I.S: Systems online. How may I assist you, Boss?",
                "ai"
            );
        }

    },
    500
);
