
document.addEventListener("DOMContentLoaded", () => {
    const inputText = document.getElementById("inputText");
    const outputText = document.getElementById("outputText");

    const sourceLanguage = document.getElementById("sourceLanguage");
    const targetLanguage = document.getElementById("targetLanguage");

    const translateButton = document.getElementById("translateButton");
    const buttonText = document.getElementById("buttonText");

    const swapButton = document.getElementById("swapButton");
    const clearButton = document.getElementById("clearButton");
    const copyButton = document.getElementById("copyButton");
    const speakButton = document.getElementById("speakButton");

    const charCount = document.getElementById("charCount");
    const outputCount = document.getElementById("outputCount");
    const message = document.getElementById("message");

    const historyList = document.getElementById("historyList");
    const clearHistoryButton = document.getElementById("clearHistoryButton");

    let currentTranslation = "";
    let history = [];

    const languageNames = {};

    [...sourceLanguage.options, ...targetLanguage.options].forEach(option => {
        languageNames[option.value] = option.textContent.trim();
    });

    // MESSAGE DISPLAY
    function showMessage(text, isError = false) {
        message.textContent = text;
        message.classList.toggle("error", isError);
    }

    // CHARACTER COUNTER
    inputText.addEventListener("input", () => {
        charCount.textContent = `${inputText.value.length} / 5000`;
    });

    // TRANSLATION
    translateButton.addEventListener("click", async () => {
        const text = inputText.value.trim();

        if (!text) {
            showMessage("Please enter some text first.", true);
            inputText.focus();
            return;
        }

        if (sourceLanguage.value === targetLanguage.value) {
            showMessage("Please select two different languages.", true);
            return;
        }

        translateButton.disabled = true;
        buttonText.textContent = "Translating...";
        outputText.textContent = "✨ Your words are travelling through the language universe...";
        showMessage("Our AI assistant is working on it...");

        try {
            const response = await fetch("/api/translate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    text: text,
                    source: sourceLanguage.value,
                    target: targetLanguage.value
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Translation failed.");
            }

            currentTranslation = data.translation;
            outputText.textContent = currentTranslation;
            outputCount.textContent = `${currentTranslation.length} characters`;

            showMessage("Translation completed successfully! ✨");

            saveHistory({
                original: text,
                translated: currentTranslation,
                source: sourceLanguage.value,
                target: targetLanguage.value,
                date: new Date().toLocaleString()
            });

        } catch (error) {
            outputText.textContent = "Your translation will appear here...";
            currentTranslation = "";
            outputCount.textContent = "0 characters";
            showMessage(error.message, true);

        } finally {
            translateButton.disabled = false;
            buttonText.textContent = "Translate Now";
        }
    });

    // SWAP LANGUAGES
    swapButton.addEventListener("click", () => {
        if (sourceLanguage.value === "auto") {
            showMessage("Choose a source language before swapping.", true);
            return;
        }

        const previousSource = sourceLanguage.value;

        sourceLanguage.value = targetLanguage.value;
        targetLanguage.value = previousSource;

        if (currentTranslation) {
            inputText.value = currentTranslation;
            charCount.textContent = `${currentTranslation.length} / 5000`;

            currentTranslation = "";
            outputText.textContent = "Your translation will appear here...";
            outputCount.textContent = "0 characters";
        }

        showMessage("Languages swapped successfully! ⇄");
    });

    // CLEAR INPUT
    clearButton.addEventListener("click", () => {
        inputText.value = "";
        currentTranslation = "";

        outputText.textContent = "Your translation will appear here...";
        charCount.textContent = "0 / 5000";
        outputCount.textContent = "0 characters";

        showMessage("");
        window.speechSynthesis?.cancel();
    });

    // COPY TRANSLATION
    copyButton.addEventListener("click", async () => {
        if (!currentTranslation) {
            showMessage("Translate something before copying.", true);
            return;
        }

        try {
            await navigator.clipboard.writeText(currentTranslation);
            showMessage("Translation copied to clipboard! 📋");
        } catch {
            showMessage("Clipboard access failed. Please copy manually.", true);
        }
    });

    // TEXT TO SPEECH
    speakButton.addEventListener("click", () => {
        if (!currentTranslation) {
            showMessage("Translate something before listening.", true);
            return;
        }

        if (!("speechSynthesis" in window)) {
            showMessage("Speech is not supported in this browser.", true);
            return;
        }

        window.speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(currentTranslation);
        speech.lang = targetLanguage.value;
        speech.rate = 0.9;
        speech.pitch = 1.05;

        window.speechSynthesis.speak(speech);
        showMessage("Playing your translation... 🔊");
    });

    // SAVE HISTORY
    function saveHistory(item) {
        history.unshift(item);
        history = history.slice(0, 10);

        try {
            localStorage.setItem("linguaflow_history", JSON.stringify(history));
        } catch (error) {
            console.warn("Could not save translation history.", error);
        }

        renderHistory();
    }

    // LOAD HISTORY
    try {
        history = JSON.parse(localStorage.getItem("linguaflow_history") || "[]");

        if (!Array.isArray(history)) {
            history = [];
        }
    } catch {
        history = [];
    }

    // DISPLAY HISTORY
    function renderHistory() {
        historyList.innerHTML = "";

        if (history.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <span>◷</span>
                    <p>Your recent translations will appear here.</p>
                </div>
            `;
            return;
        }

        history.forEach((item, index) => {
            const card = document.createElement("div");
            card.className = "history-item";

            const details = document.createElement("div");

            const original = document.createElement("p");
            original.textContent = item.original;

            const languages = document.createElement("small");
            languages.textContent =
                `${languageNames[item.source] || item.source} → ${languageNames[item.target] || item.target}`;

            details.append(original, languages);

            const arrow = document.createElement("span");
            arrow.textContent = "↗";
            arrow.style.color = "#40eaff";

            card.append(details, arrow);

            card.addEventListener("click", () => {
                inputText.value = item.original;
                outputText.textContent = item.translated;

                sourceLanguage.value = item.source;
                targetLanguage.value = item.target;

                currentTranslation = item.translated;

                charCount.textContent = `${item.original.length} / 5000`;
                outputCount.textContent = `${item.translated.length} characters`;

                showMessage("Previous translation restored! ✨");
                window.scrollTo({ top: 0, behavior: "smooth" });
            });

            historyList.appendChild(card);
        });
    }

    // CLEAR HISTORY
    clearHistoryButton.addEventListener("click", () => {
        history = [];

        try {
            localStorage.removeItem("linguaflow_history");
        } catch (error) {
            console.warn("Could not clear history.", error);
        }

        renderHistory();
        showMessage("Translation history cleared.");
    });

    // INITIALIZE
    renderHistory();

    // ROBOT ASSISTANT
    const robot = document.createElement("div");
    robot.className = "robot-assistant";

    robot.innerHTML = `
        <div class="robot-message" id="robotMessage">
            Hey there! 👋 I'm Lumi! Your language buddy.
            Let's translate something magical! ✨
        </div>

        <div class="robot-character" id="robotCharacter" title="Chat with Lumi">
            <div class="robot-antenna">
                <span></span>
            </div>

            <div class="robot-head">
                <div class="robot-ear left"></div>

                <div class="robot-face">
                    <div class="robot-eyes">
                        <span></span>
                        <span></span>
                    </div>
                    <div class="robot-mouth"></div>
                </div>

                <div class="robot-ear right"></div>
            </div>

            <div class="robot-body">
                <span>✦</span>
            </div>
        </div>
    `;

    document.body.appendChild(robot);

    const robotCharacter = document.getElementById("robotCharacter");
    const robotMessage = document.getElementById("robotMessage");

    const robotMessages = [
        "Need a translation? I'm right here! 💜",
        "Fun fact: There are thousands of languages in the world! 🌍",
        "Try translating a sentence into another language! ✨",
        "Psst... don't forget to listen to your translation! 🔊",
        "Every new word is a new adventure! 🚀"
    ];

    robotCharacter.addEventListener("click", () => {
        const randomMessage =
            robotMessages[Math.floor(Math.random() * robotMessages.length)];

        robotMessage.textContent = randomMessage;
        robotMessage.classList.add("show");

        robotCharacter.classList.add("robot-bounce");

        setTimeout(() => {
            robotCharacter.classList.remove("robot-bounce");
        }, 600);
    });

    setTimeout(() => {
        robotMessage.classList.add("show");
    }, 1200);

    setTimeout(() => {
        robotMessage.classList.remove("show");
    }, 6500);
});
