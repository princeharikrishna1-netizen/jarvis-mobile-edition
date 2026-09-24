// =====================================================
// J.A.R.V.I.S - AI CORE
// =====================================================

// ===== 1. API KEY & SMART MODELS =====

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


// ===== 2. MEMORY SYSTEM =====

let MEMORY = JSON.parse(
    localStorage.getItem('jarvis_memory') || '[]'
);

function saveMemory() {
    localStorage.setItem(
        'jarvis_memory',
        JSON.stringify(MEMORY)
    );
}


// ===== 3. DOM ELEMENTS =====

const chat = document.getElementById('chat');
const input = document.getElementById('msg');

const micBtn = document.getElementById('mic-btn');
const clearBtn = document.getElementById('clear-btn');
const camBtn = document.getElementById('cam-btn');
const imgInput = document.getElementById('img-input');
const sendBtn = document.getElementById('send');


// ===== 4. LOAD SAVED MEMORY =====

MEMORY.forEach(m => {

    add(
        (m.role === 'user'
            ? 'YOU: '
            : 'J.A.R.V.I.S: ') + m.text,

        m.role === 'user'
            ? 'user'
            : 'ai'
    );

});


// ===== 5. GEMINI BRAIN =====

async function callGemini(prompt) {

    const contents = MEMORY
        .slice(-12)
        .map(m => ({
            role: m.role,
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

    for (const model of MODELS) {

        try {

            const res = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                model +
                ":generateContent?key=" +
                API_KEY,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        contents: contents
                    })
                }
            );

            const data = await res.json();

            if (data.error) {

                lastErr = new Error(
                    data.error.message
                );

                if (
                    /high demand|temporar|quota|rate|unavailable|deprecated/i
                    .test(data.error.message)
                ) {
                    continue;
                }

                throw lastErr;
            }

            return data
                .candidates[0]
                .content
                .parts[0]
                .text;

        }

        catch (e) {

            lastErr = e;

        }
    }

    throw lastErr;
}


// ===== 6. ASK GEMINI =====

async function askGemini(prompt) {

    const thinking = add(
        'J.A.R.V.I.S: Thinking...',
        'ai'
    );

    try {

        const reply = await callGemini(prompt);

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
            'J.A.R.V.I.S: ' + reply;

        speak(reply);

    }

    catch (e) {

        thinking.innerText =
            'J.A.R.V.I.S: ERROR - ' +
            e.message;

    }
}


// ===== 7. VISION ENGINE =====

if (camBtn && imgInput) {

    camBtn.onclick = () => {
        imgInput.click();
    };

    imgInput.onchange = () => {

        const file = imgInput.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = () => {

            const base64 =
                reader.result.split(',')[1];

            const question =
                input.value.trim() ||
                'What do you see? Describe briefly.';

            add(
                'YOU: [IMAGE] ' + question,
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


// ===== 8. IMAGE ANALYSIS =====

async function askVision(base64, mime, question) {

    const thinking = add(
        'J.A.R.V.I.S: Analyzing image...',
        'ai'
    );

    let lastErr;

    for (const model of MODELS) {

        try {

            const res = await fetch(
                "https://generativelanguage.googleapis.com/v1beta/models/" +
                model +
                ":generateContent?key=" +
                API_KEY,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        contents: [
                            {
                                parts: [
                                    {
                                        text: question
                                    },
                                    {
                                        inline_data: {
                                            mime_type: mime,
                                            data: base64
                                        }
                                    }
                                ]
                            }
                        ]

                    })
                }
            );

            const data = await res.json();

            if (data.error) {

                lastErr =
                    new Error(
                        data.error.message
                    );

                if (
                    /high demand|temporar|quota|rate|unavailable|deprecated/i
                    .test(data.error.message)
                ) {
                    continue;
                }

                throw lastErr;
            }

            const reply =
                data.candidates[0]
                    .content
                    .parts[0]
                    .text;

            thinking.innerText =
                'J.A.R.V.I.S: ' + reply;

            speak(reply);

            return;
        }

        catch (e) {

            lastErr = e;

        }
    }

    thinking.innerText =
        'J.A.R.V.I.S: ERROR - ' +
        (lastErr?.message || 'Unknown error');
}


// ===== 9. VOICE INTERFACE =====

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (SpeechRecognition && micBtn) {

    const recognition =
        new SpeechRecognition();

    recognition.lang = 'en-US';

    recognition.continuous = false;

    recognition.interimResults = false;

    recognition.onresult = (event) => {

        const text =
            event.results[0][0].transcript;

        add(
            'YOU: ' + text,
            'user'
        );

        askGemini(text);
    };

    micBtn.onclick = () => {

        try {

            recognition.start();

            micBtn.innerText =
                'LISTENING...';

        }

        catch (e) {

            console.log(e);

        }
    };

    recognition.onend = () => {

        micBtn.innerText = '🎙';

    };
}


// ===== 10. TEXT TO SPEECH =====

let voices = [];

function loadVoices() {

    voices =
        speechSynthesis.getVoices();

}

loadVoices();

speechSynthesis.onvoiceschanged =
    loadVoices;


function speak(text) {

    if (!('speechSynthesis' in window)) {
        return;
    }

    speechSynthesis.cancel();

    const utterance =
        new SpeechSynthesisUtterance(text);

    utterance.rate = 1.05;

    utterance.pitch = 0.85;

    const voice =
        voices.find(v =>
            v.lang.startsWith('en')
        );

    if (voice) {
        utterance.voice = voice;
    }

    speechSynthesis.speak(
        utterance
    );
}


// ===== 11. SEND BUTTON =====

sendBtn.onclick = () => {

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


// ===== 12. ENTER KEY =====

input.addEventListener(
    'keydown',
    event => {

        if (event.key === 'Enter') {

            sendBtn.click();

        }

    }
);


// ===== 13. CLEAR MEMORY =====

if (clearBtn) {

    clearBtn.onclick = () => {

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


// ===== 14. CHAT MESSAGE FUNCTION =====

function add(text, type) {

    const div =
        document.createElement('div');

    div.className =
        'msg ' + type;

    div.innerText = text;

    chat.appendChild(div);

    chat.scrollTop =
        chat.scrollHeight;

    return div;
}


// ===== 15. STARTUP MESSAGE =====

setTimeout(() => {

    if (MEMORY.length === 0) {

        add(
            'J.A.R.V.I.S: Systems online. How may I assist you, Boss?',
            'ai'
        );

    }

}, 500);
