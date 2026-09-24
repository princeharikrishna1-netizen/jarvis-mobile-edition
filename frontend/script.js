// =====================================================
// J.A.R.V.I.S - 5 TOOLS
// =====================================================

async function handleTools(text) {

    const t = text.toLowerCase().trim();


    // =================================================
    // 1. TIME
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
    // 2. WEATHER
    // =================================================

    if (
        t.includes('weather') ||
        t.includes('వాతావరణం')
    ) {

        return new Promise(resolve => {

            if (!navigator.geolocation) {

                resolve(
                    'Geolocation is not supported by this browser, Boss.'
                );

                return;
            }

            navigator.geolocation.getCurrentPosition(

                async position => {

                    try {

                        const latitude =
                            position.coords.latitude;

                        const longitude =
                            position.coords.longitude;

                        const url =
                            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

                        const response =
                            await fetch(url);

                        if (!response.ok) {
                            throw new Error(
                                'Weather request failed'
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
                            'Weather Error:',
                            error
                        );

                        resolve(
                            'Weather service error, Boss.'
                        );
                    }
                },

                error => {

                    console.error(
                        'Location Error:',
                        error
                    );

                    resolve(
                        'I need location permission for weather, Boss.'
                    );
                }
            );
        });
    }


    // =================================================
    // 3. TIMER
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

            factor = 60 * 60 * 1000;

        } else if (
            /^(seconds?|secs?)$/i.test(unit)
        ) {

            factor = 1000;

        } else {

            factor = 60 * 1000;
        }


        const duration =
            amount * factor;


        setTimeout(() => {

            const message =
                `Timer completed! ${amount} ${unit} finished, Boss.`;

            add(
                'J.A.R.V.I.S: ' + message,
                'ai'
            );

            speak(message);

        }, duration);


        return (
            `Timer set for ${amount} ${unit}, Boss.`
        );
    }


    // =================================================
    // 4. TRANSLATE ENGLISH → TELUGU
    // =================================================

    if (
        t.startsWith('translate ') ||
        t.startsWith('translate this ')
    ) {

        const q =
            text
                .replace(
                    /^translate (this )?/i,
                    ''
                )
                .trim();


        if (!q) {

            return 'Please tell me what you want me to translate, Boss.';
        }


        try {

            const url =
                'https://api.mymemory.translated.net/get?q=' +
                encodeURIComponent(q) +
                '&langpair=en|te';


            const response =
                await fetch(url);


            if (!response.ok) {

                throw new Error(
                    'Translation request failed'
                );
            }


            const data =
                await response.json();


            if (
                !data.responseData ||
                !data.responseData.translatedText
            ) {

                throw new Error(
                    'Translation not available'
                );
            }


            return (
                'In Telugu: ' +
                data.responseData.translatedText
            );

        } catch (error) {

            console.error(
                'Translation Error:',
                error
            );

            return (
                'Translation service error, Boss.'
            );
        }
    }


    // =================================================
    // 5. YOUTUBE SEARCH
    // =================================================

    if (
        t.startsWith('play ') ||
        t.startsWith('youtube ') ||
        t.startsWith('youtube search ')
    ) {

        let query = text;


        query =
            query.replace(
                /^youtube search /i,
                ''
            );


        query =
            query.replace(
                /^youtube /i,
                ''
            );


        query =
            query.replace(
                /^play /i,
                ''
            );


        query = query.trim();


        if (!query) {

            return (
                'Please tell me what you want to play on YouTube, Boss.'
            );
        }


        const youtubeURL =
            'https://www.youtube.com/results?search_query=' +
            encodeURIComponent(query);


        window.open(
            youtubeURL,
            '_blank'
        );


        return (
            'Searching YouTube for ' +
            query +
            ', Boss.'
        );
    }


    // =================================================
    // NO TOOL MATCHED
    // =================================================

    return null;
}
