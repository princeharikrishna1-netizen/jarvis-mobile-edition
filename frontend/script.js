// =====================================================
// J.A.R.V.I.S - AI CORE + 15 TOOLS
// =====================================================

// =====================================================
// 1. API KEY & SMART MODELS
// =====================================================

let API_KEY = localStorage.getItem('jarvis_key');

if (!API_KEY) {
    API_KEY = prompt('Enter your Gemini API Key:');

    if (API_KEY) {
        localStorage.setItem('jarvis_key', API_KEY);
    }
}

const MODELS = [
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
];


// =====================================================
// 2. MEMORY SYSTEM
// =====================================================

let MEMORY = JSON.parse(
    localStorage.getItem('jarvis_memory') || '[]'
);

function saveMemory() {

    localStorage.setItem(
        'jarvis_memory',
        JSON.stringify(MEMORY)
    );

}


// =====================================================
// 3. TOOLS — 15 TOOLS
// =====================================================

async function handleTools(text) {

    const t = text.toLowerCase().trim();


    // =================================================
    // TOOL 1 — TIME
    // =================================================

    if (
        /\btime\b/.test(t) ||
        t.includes('టైమ్') ||
        t.includes('సమయం')
    ) {

        return (
            'The time is ' +
            new Date().toLocaleTimeString() +
            ', Boss.'
        );

    }


    // =================================================
    // TOOL 2 — DATE
    // =================================================

    if (
        /\bdate\b/.test(t) ||
        t.includes('తేదీ') ||
        t.includes('today')
    ) {

        return (
            'Today is ' +
            new Date().toLocaleDateString(
                'en-IN',
                {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }
            ) +
            ', Boss.'
        );

    }


    // =================================================
    // TOOL 3 — WEATHER
    // =================================================

    if (
        t.includes('weather') ||
        t.includes('వాతావరణం')
    ) {

        return await new Promise(resolve => {

            if (!navigator.geolocation) {

                resolve(
                    'Geolocation is not supported, Boss.'
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

                        const data =
                            await response.json();

                        const weather =
                            data.current_weather;

                        if (!weather) {

                            resolve(
                                'Weather data unavailable, Boss.'
                            );

                            return;
                        }

                        resolve(
                            `Temperature is ${weather.temperature}°C and wind speed is ${weather.windspeed} km/h, Boss.`
                        );

                    }

                    catch (error) {

                        resolve(
                            'Weather service error, Boss.'
                        );

                    }

                },

                () => {

                    resolve(
                        'Location permission is required for weather, Boss.'
                    );

                }

            );

        });

    }


    // =================================================
    // TOOL 4 — TIMER
    // =================================================

    const timerMatch =
        t.match(
            /(\d+)\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)/i
        );

    if (
        (
            t.includes('timer') ||
            t.includes('టైమర్')
        ) &&
        timerMatch
    ) {

        const amount =
            parseInt(timerMatch[1]);

        const unit =
            timerMatch[2].toLowerCase();

        let factor;

        if (
            /^(hours?|hrs?|h)/.test(unit)
        ) {

            factor = 3600000;

        }
        else if (
            /^(seconds?|secs?|s)/.test(unit)
        ) {

            factor = 1000;

        }
        else {

            factor = 60000;

        }

        const duration =
            amount * factor;


        setTimeout(() => {

            speak(
                `Timer finished. ${amount} ${unit} completed.`
            );

            alert(
                `⏰ J.A.R.V.I.S TIMER\n\n${amount} ${unit} completed!`
            );

        }, duration);


        return (
            `Timer set for ${amount} ${unit}, Boss.`
        );

    }


    // =================================================
    // TOOL 5 — YOUTUBE
    // =================================================

    if (
        t.includes('youtube') ||
        t.startsWith('play ')
    ) {

        const q =
            text
                .replace(
                    /youtube\s*(search\s*)?/i,
                    ''
                )
                .replace(
                    /^play\s+/i,
                    ''
                )
                .trim();


        if (q) {

            window.open(
                'https://www.youtube.com/results?search_query=' +
                encodeURIComponent(q),
                '_blank'
            );

            return (
                'Searching YouTube for ' +
                q +
                ', Boss.'
            );

        }

    }


    // =================================================
    // TOOL 6 — CALCULATOR
    // =================================================

    if (
        t.startsWith('calculate ') ||
        t.startsWith('calculator ') ||
        t.startsWith('calc ')
    ) {

        const expression =
            text
                .replace(
                    /^(calculate|calculator|calc)\s+/i,
                    ''
                )
                .trim();


        if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {

            return (
                'I can calculate numbers and basic mathematical expressions only, Boss.'
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
                `${expression} = ${result}, Boss.`
            );

        }

        catch {

            return (
                'Invalid mathematical expression, Boss.'
            );

        }

    }


    // =================================================
    // TOOL 7 — OPEN WEBSITE
    // =================================================

    if (
        t.startsWith('open website ') ||
        t.startsWith('open site ') ||
        t.startsWith('open url ')
    ) {

        let url =
            text
                .replace(
                    /^(open website|open site|open url)\s+/i,
                    ''
                )
                .trim();


        if (
            !url.startsWith('http://') &&
            !url.startsWith('https://')
        ) {

            url =
                'https://' + url;

        }


        window.open(url, '_blank');

        return (
            'Opening ' + url + ', Boss.'
        );

    }


    // =================================================
    // TOOL 8 — GOOGLE SEARCH
    // =================================================

    if (
        t.startsWith('search google ') ||
        t.startsWith('google search ') ||
        t.startsWith('search for ')
    ) {

        const q =
            text
                .replace(
                    /^(search google|google search|search for)\s+/i,
                    ''
                )
                .trim();


        if (q) {

            window.open(
                'https://www.google.com/search?q=' +
                encodeURIComponent(q),
                '_blank'
            );

            return (
                'Searching Google for ' +
                q +
                ', Boss.'
            );

        }

    }


    // =================================================
    // TOOL 9 — TRANSLATE
    // =================================================

    if (
        t.startsWith('translate')
    ) {

        const q =
            text
                .replace(
                    /^translate\s*(this\s*)?/i,
                    ''
                )
                .trim();


        if (!q) {

            return (
                'Please provide something to translate, Boss.'
            );

        }


        try {

            const url =
                'https://api.mymemory.translated.net/get?q=' +
                encodeURIComponent(q) +
                '&langpair=en|te';


            const response =
                await fetch(url);

            const data =
                await response.json();


            return (
                'In Telugu: ' +
                data.responseData.translatedText
            );

        }

        catch {

            return (
                'Translation service error, Boss.'
            );

        }

    }


    // =================================================
    // TOOL 10 — STOPWATCH
    // =================================================

    if (
        t.includes('start stopwatch') ||
        t.includes('start stop watch')
    ) {

        window.jarvisStopwatchStart =
            Date.now();

        return (
            'Stopwatch started, Boss.'
        );

    }


    if (
        t.includes('stop stopwatch') ||
        t.includes('stop stop watch')
    ) {

        if (!window.jarvisStopwatchStart) {

            return (
                'Stopwatch is not running, Boss.'
            );

        }


        const elapsed =
            Date.now() -
            window.jarvisStopwatchStart;


        window.jarvisStopwatchStart =
            null;


        const seconds =
            Math.floor(elapsed / 1000);


        return (
            `Stopwatch stopped. Elapsed time: ${seconds} seconds, Boss.`
        );

    }


    // =================================================
    // TOOL 11 — NOTES
    // =================================================

    if (
        t.startsWith('note ') ||
        t.startsWith('remember ')
    ) {

        const note =
            text
                .replace(
                    /^(note|remember)\s+/i,
                    ''
                )
                .trim();


        if (!note) {

            return (
                'Please provide a note, Boss.'
            );

        }


        let notes =
            JSON.parse(
                localStorage.getItem(
                    'jarvis_notes'
                ) || '[]'
            );


        notes.push({
            text: note,
            time: new Date().toISOString()
        });


        localStorage.setItem(
            'jarvis_notes',
            JSON.stringify(notes)
        );


        return (
            'Note saved successfully, Boss.'
        );

    }


    // =================================================
    // TOOL 12 — SHOW NOTES
    // =================================================

    if (
        t.includes('show notes') ||
        t.includes('my notes') ||
        t.includes('show my notes')
    ) {

        const notes =
            JSON.parse(
                localStorage.getItem(
                    'jarvis_notes'
                ) || '[]'
            );


        if (!notes.length) {

            return (
                'You do not have any saved notes, Boss.'
            );

        }


        return (
            'Your notes:\n\n' +
            notes
                .map(
                    (n, i) =>
                        `${i + 1}. ${n.text}`
                )
                .join('\n')
        );

    }


    // =================================================
    // TOOL 13 — SYSTEM INFO
    // =================================================

    if (
        t.includes('system info') ||
        t.includes('computer info') ||
        t.includes('device info')
    ) {

        return `
System Information:

Browser: ${navigator.userAgent}
Platform: ${navigator.platform}
Language: ${navigator.language}
CPU Cores: ${navigator.hardwareConcurrency || 'Unknown'}
Online: ${navigator.onLine ? 'Yes' : 'No'}
Screen: ${screen.width} x ${screen.height}
Boss.
        `.trim();

    }


    // =================================================
    // TOOL 14 — IP ADDRESS
    // =================================================

    if (
        t.includes('my ip') ||
        t.includes('ip address')
    ) {

        try {

            const response =
                await fetch(
                    'https://api.ipify.org?format=json'
                );

            const data =
                await response.json();


            return (
                `Your public IP address is ${data.ip}, Boss.`
            );

        }

        catch {

            return (
                'Unable to retrieve your IP address, Boss.'
            );

        }

    }


    // =================================================
    // TOOL 15 — RANDOM NUMBER
    // =================================================

    if (
        t.includes('random number') ||
        t.includes('generate random number')
    ) {

        const match =
            t.match(
                /(\d+)\s*(to|-)\s*(\d+)/
            );


        if (match) {

            const min =
                parseInt(match[1]);

            const max =
                parseInt(match[3]);


            const number =
                Math.floor(
                    Math.random() *
                    (max - min + 1)
                ) + min;


            return (
                `Random number between ${min} and ${max}: ${number}, Boss.`
            );

        }


        return (
            'Example: random number 1 to 100, Boss.'
        );

    }


    // =================================================
    // NO TOOL MATCH
    // =================================================

    return null;

}


// =====================================================
// 4. DOM ELEMENTS
// =====================================================

const chat =
    document.getElementById('chat');

const input =
    document.getElementById('msg');

const micBtn =
    document.getElementById('mic-btn');

const clearBtn =
    document.getElementById('clear-btn');

const camBtn =
    document.getElementById('cam-btn');

const imgInput =
    document.getElementById('img-input');

const sendBtn =
    document.getElementById('send');


// =====================================================
// 5. LOAD SAVED MEMORY
// =====================================================

MEMORY.forEach(m => {

    add(
        (
            m.role === 'user'
                ? 'YOU: '
                : 'J.A.R.V.I.S: '
        ) + m.text,

        m.role === 'user'
            ? 'user'
            : 'ai'
    );

});


// =====================================================
// 6. GEMINI BRAIN
// =====================================================

async function callGemini(prompt) {

    const contents =
        MEMORY
            .slice(-12)
            .map(m => ({

                role:
                    m.role === 'model'
                        ? 'model'
                        : 'user',

                parts: [
                    {
                        text: m.text
                    }
                ]

            }));


    contents.push({

        role: 'user',

        parts: [
            {
                text: prompt
            }
        ]

    });


    let lastErr;


    for (
        const model of MODELS
    ) {

        try {

            const res =
                await fetch(
                    'https://generativelanguage.googleapis.com/v1beta/models/' +
                    model +
                    ':generateContent?key=' +
                    API_KEY,
                    {

                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                contents:
                                    contents
                            })

                    }
                );


            const data =
                await res.json();


            if (data.error) {

                lastErr =
                    new Error(
                        data.error.message
                    );


                if (
                    /high demand|temporar|quota|rate|unavailable|deprecated/i
                        .test(
                            data.error.message
                        )
                ) {

                    continue;

                }


                throw lastErr;

            }


            if (
                !data.candidates ||
                !data.candidates[0]
            ) {

                throw new Error(
                    'No response from Gemini.'
                );

            }


            return (
                data
                    .candidates[0]
                    .content
                    .parts[0]
                    .text
            );

        }

        catch (e) {

            lastErr = e;

        }

    }


    throw (
        lastErr ||
        new Error('Gemini request failed.')
    );

}


// =====================================================
// 7. ASK J.A.R.V.I.S
// =====================================================

async function askGemini(prompt) {

    const thinking =
        add(
            'J.A.R.V.I.S: Thinking...',
            'ai'
        );


    try {

        // =============================================
        // FIRST → TOOLS
        // =============================================

        const toolResult =
            await handleTools(prompt);


        if (toolResult !== null) {

            MEMORY.push({
                role: 'user',
                text: prompt
            });


            MEMORY.push({
                role: 'model',
                text: toolResult
            });


            saveMemory();


            thinking.innerText =
                'J.A.R.V.I.S: ' +
                toolResult;


            speak(toolResult);


            return;

        }


        // =============================================
        // SECOND → GEMINI
        // =============================================

        const reply =
            await callGemini(prompt);


        MEMORY.push({
            role: 'user',
            text: prompt
        });


        MEMORY.push({
            role: 'model',
            text: reply
        });


        saveMemory();


        thinking.innerText =
            'J.A.R.V.I.S: ' +
            reply;


        speak(reply);

    }

    catch (e) {

        console.error(e);


        thinking.innerText =
            'J.A.R.V.I.S: ERROR - ' +
            e.message;

    }

}


// =====================================================
// 8. VISION ENGINE
// =====================================================

if (
    camBtn &&
    imgInput
) {

    camBtn.onclick = () => {

        imgInput.click();

    };


    imgInput.onchange = () => {

        const file =
            imgInput.files[0];


        if (!file) return;


        const reader =
            new FileReader();


        reader.onload = () => {

            const base64 =
                reader.result
                    .split(',')[1];


            const question =
                input.value.trim() ||
                'What do you see? Describe briefly.';


            add(
                'YOU: [IMAGE] ' +
                question,
                'user'
            );


            input.value = '';


            askVision(
                base64,
                file.type,
                question
            );

        };


        reader.readAsDataURL(file);

    };

}


// =====================================================
// 9. IMAGE ANALYSIS
// =====================================================

async function askVision(
    base64,
    mime,
    question
) {

    const thinking =
        add(
            'J.A.R.V.I.S: Analyzing image...',
            'ai'
        );


    let lastErr;


    for (
        const model of MODELS
    ) {

        try {

            const res =
                await fetch(
                    'https://generativelanguage.googleapis.com/v1beta/models/' +
                    model +
                    ':generateContent?key=' +
                    API_KEY,
                    {

                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({

                                contents: [

                                    {

                                        role: 'user',

                                        parts: [

                                            {
                                                text:
                                                    question
                                            },

                                            {
                                                inline_data: {

                                                    mime_type:
                                                        mime,

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
                await res.json();


            if (data.error) {

                lastErr =
                    new Error(
                        data.error.message
                    );


                if (
                    /high demand|temporar|quota|rate|unavailable|deprecated/i
                        .test(
                            data.error.message
                        )
                ) {

                    continue;

                }


                throw lastErr;

            }


            const reply =
                data
                    .candidates[0]
                    .content
                    .parts[0]
                    .text;


            thinking.innerText =
                'J.A.R.V.I.S: ' +
                reply;


            speak(reply);


            return;

        }

        catch (e) {

            lastErr = e;

        }

    }


    thinking.innerText =
        'J.A.R.V.I.S: ERROR - ' +
        (
            lastErr?.message ||
            'Unknown error'
        );

}


// =====================================================
// 10. VOICE RECOGNITION
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
        'en-US';


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.onresult =
        event => {

            const text =
                event
                    .results[0][0]
                    .transcript;


            add(
                'YOU: ' + text,
                'user'
            );


            askGemini(text);

        };


    micBtn.onclick =
        () => {

            try {

                recognition.start();

                micBtn.innerText =
                    'LISTENING...';

            }

            catch (e) {

                console.log(e);

            }

        };


    recognition.onend =
        () => {

            micBtn.innerText =
                '🎙';

        };

}


// =====================================================
// 11. TEXT TO SPEECH
// =====================================================

let voices = [];


function loadVoices() {

    voices =
        speechSynthesis.getVoices();

}


loadVoices();


speechSynthesis.onvoiceschanged =
    loadVoices;


function speak(text) {

    if (
        !('speechSynthesis' in window)
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
            v =>
                v.lang.startsWith('en')
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
// 12. SEND BUTTON
// =====================================================

sendBtn.onclick =
    () => {

        const text =
            input.value.trim();


        if (!text) return;


        add(
            'YOU: ' + text,
            'user'
        );


        input.value = '';


        askGemini(text);

    };


// =====================================================
// 13. ENTER KEY
// =====================================================

input.addEventListener(
    'keydown',
    event => {

        if (
            event.key === 'Enter'
        ) {

            event.preventDefault();

            sendBtn.click();

        }

    }
);


// =====================================================
// 14. CLEAR MEMORY
// =====================================================

if (clearBtn) {

    clearBtn.onclick =
        () => {

            const confirmClear =
                confirm(
                    'Are you sure you want to clear J.A.R.V.I.S memory?'
                );


            if (!confirmClear) {

                return;

            }


            MEMORY = [];


            saveMemory();


            chat.innerHTML = '';


            add(
                'SYSTEM: Memory cleared.',
                'ai'
            );

        };

}


// =====================================================
// 15. CHAT MESSAGE FUNCTION
// =====================================================

function add(
    text,
    type
) {

    const div =
        document.createElement(
            'div'
        );


    div.className =
        'msg ' + type;


    div.innerText =
        text;


    chat.appendChild(
        div
    );


    chat.scrollTop =
        chat.scrollHeight;


    return div;

}


// =====================================================
// 16. STARTUP MESSAGE
// =====================================================

setTimeout(
    () => {

        if (
            MEMORY.length === 0
        ) {

            add(
                'J.A.R.V.I.S: Systems online. How may I assist you, Boss?',
                'ai'
            );

        }

    },
    500
);
