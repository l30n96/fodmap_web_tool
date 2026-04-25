# FODMAP Checker

Einfache Web-App zum Nachschlagen von FODMAP-Werten für Lebensmittel.

## Features

- 🔍 **Suche** mit Autocomplete (Deutsch & Englisch)
- 📋 **Mehrere Listen** – erstellen, benennen, löschen
- 💾 **Automatisch gespeichert** im Browser (localStorage)
- 🌍 **Spracheinstellung** (DE/EN) wird gespeichert
- 📊 **Sortierung** nach FODMAP-Index, Kategorie oder Name
- ↓ **Export** als CSV oder JSON
- 150 Lebensmittel in der Datenbank

## Datenbank

- `public/data/fodmap.json` – Originaldaten (Englisch)
- `public/data/fodmap_de.json` – Deutsche Übersetzung

FODMAP-Werte: `low` / `medium` / `high`  
Details (0 = niedrig, 1 = mittel, 2 = hoch): Oligos, Fructose, Polyole, Laktose

## Datenbank erweitern / übersetzen

Mit Google Colab und `deep-translator` (kein API-Key nötig):

```python
!pip install deep-translator requests

import requests, json, time, csv
from deep_translator import GoogleTranslator

url = "https://raw.githubusercontent.com/oseparovic/fodmap_list/master/fodmap_repo.json"
data = requests.get(url).json()

translator = GoogleTranslator(source='en', target='de')

unique_names = list({item["name"] for item in data})
unique_cats  = list({item["category"] for item in data})

def translate_batch(items):
    result = {}
    for i in range(0, len(items), 50):
        chunk = items[i:i+50]
        translations = translator.translate_batch(chunk)
        result.update(dict(zip(chunk, translations)))
        time.sleep(0.5)
    return result

name_map = translate_batch(unique_names)
cat_map  = translate_batch(unique_cats)

# Ausgabe als JSON im Format der fodmap_de.json
output = []
for item in data:
    d = item.get("details", {})
    output.append({
        "id": item["id"],
        "name": item["name"],
        "name_de": name_map.get(item["name"], item["name"]),
        "category": item["category"],
        "category_de": cat_map.get(item["category"], item["category"]),
        "fodmap": item["fodmap"],
        "oligos":   d.get("oligos", 0),
        "fructose": d.get("fructose", 0),
        "polyols":  d.get("polyols", 0),
        "lactose":  d.get("lactose", 0),
        "qty": item.get("qty", "")
    })

with open("fodmap_de.json", "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)
```

## Railway Deployment

1. Repo auf GitHub pushen (public)
2. railway.app → New Project → Deploy from GitHub
3. Repo auswählen → fertig 🚀

Railway erkennt `package.json` automatisch und startet `npm start`.

## Lokale Entwicklung

```bash
npm install
npm start
# → http://localhost:3000
```
