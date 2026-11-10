
import os

import deepl
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify

load_dotenv()

app = Flask(__name__)

# DeepL API configuration
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")

translator = None

if DEEPL_API_KEY:
    translator = deepl.Translator(DEEPL_API_KEY)


# Supported languages
LANGUAGES = {
    "auto": "Auto Detect",
    "ar": "Arabic",
    "bg": "Bulgarian",
    "zh": "Chinese",
    "cs": "Czech",
    "da": "Danish",
    "nl": "Dutch",
    "en": "English",
    "et": "Estonian",
    "fi": "Finnish",
    "fr": "French",
    "de": "German",
    "el": "Greek",
    "hu": "Hungarian",
    "id": "Indonesian",
    "it": "Italian",
    "ja": "Japanese",
    "ko": "Korean",
    "lv": "Latvian",
    "lt": "Lithuanian",
    "nb": "Norwegian",
    "pl": "Polish",
    "pt": "Portuguese",
    "ro": "Romanian",
    "ru": "Russian",
    "sk": "Slovak",
    "sl": "Slovenian",
    "es": "Spanish",
    "sv": "Swedish",
    "tr": "Turkish",
    "uk": "Ukrainian"
}


@app.route("/")
def home():
    return render_template("index.html", languages=LANGUAGES)


@app.route("/api/translate", methods=["POST"])
def translate():
    try:
        if translator is None:
            return jsonify({
                "success": False,
                "error": "DeepL API key is missing. Please configure your .env file."
            }), 500

        data = request.get_json(silent=True) or {}

        text = data.get("text", "").strip()
        source = data.get("source", "auto")
        target = data.get("target", "en")

        if not text:
            return jsonify({
                "success": False,
                "error": "Please enter some text to translate."
            }), 400

        if len(text) > 5000:
            return jsonify({
                "success": False,
                "error": "Text cannot exceed 5,000 characters."
            }), 400

        if source not in LANGUAGES:
            return jsonify({
                "success": False,
                "error": "Please select a valid source language."
            }), 400

        if target not in LANGUAGES or target == "auto":
            return jsonify({
                "success": False,
                "error": "Please select a valid target language."
            }), 400

        if source == target:
            return jsonify({
                "success": True,
                "translation": text
            })

        source_language = None if source == "auto" else source.upper()

        result = translator.translate_text(
            text,
            source_lang=source_language,
            target_lang=target.upper()
        )

        translated_text = result.text

        return jsonify({
            "success": True,
            "translation": translated_text
        })

    except Exception as error:
        print("DEEPL TRANSLATION ERROR:", repr(error))

        return jsonify({
            "success": False,
            "error": "Translation failed. Please check your API key, internet connection, and DeepL account."
        }), 500


if __name__ == "__main__":
    print("Starting LinguaFlow AI with DeepL...")
    app.run(host="127.0.0.1", port=5000, debug=True)
