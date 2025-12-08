# Albert Heijn API

[![npm version](https://img.shields.io/npm/v/@louaycoding/albert-heijn-api)](https://www.npmjs.com/package/@louaycoding/albert-heijn-api)
[![npm downloads](https://img.shields.io/npm/dm/@louaycoding/albert-heijn-api)](https://www.npmjs.com/package/@louaycoding/albert-heijn-api)
[![GitHub release](https://img.shields.io/github/v/release/LouayCoding/albert-heijn-api)](https://github.com/LouayCoding/albert-heijn-api/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

Unofficial REST API voor Albert Heijn producten. Haal productinformatie, prijzen, ingrediënten en allergenen op.

## Installatie

### Via npm (makkelijkst)
```bash
npm install -g @louaycoding/albert-heijn-api
ah-api
```

### Via GitHub
```bash
git clone https://github.com/LouayCoding/albert-heijn-api.git
cd albert-heijn-api
npm install
npm start
```

## Gebruik

### Producten zoeken
```bash
curl "http://localhost:3000/api/products/search?q=melk&limit=10"
```

### Product details
```bash
curl "http://localhost:3000/api/products/wi441199"
```

## API Endpoints

- `GET /api/products/search?q={query}&limit={limit}` - Zoek producten
- `GET /api/products/:id` - Product details
- `GET /api/products/categories/list` - Alle categorieën
- `GET /api/health` - Health check

## Features

- Caching (1 uur)
- Rate limiting
- Anti-detectie headers
- CORS enabled

## Tech Stack

Node.js, Express, Puppeteer

## License

MIT - Iedereen mag het gebruiken
