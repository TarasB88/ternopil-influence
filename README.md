# Епідмоніторинг Тернопільської області

Вебдашборд для щотижневого моніторингу грипу, ГРВІ, COVID-19, госпіталізацій, епідемічної інтенсивності та вакцинації.

## Джерело даних

Дані надходять із [Google Sheets](https://docs.google.com/spreadsheets/d/1Oxri7kz6UMFpkTENTjoQUHwY5yCuhczJY22c0K5fqbI/edit?gid=1951237247#gid=1951237247). Таблиця містить кілька аркушів, які можуть доповнюватися.

## Розробка локально

Потрібні Bun і Git.

```sh
git clone <this-repository-url>
cd <repository-name>
bun install
bun run dev
```

## Збірка та розгортання

```sh
bun run build
```

Розгортання налаштовано через GitHub Actions до Cloudflare Workers. Для роботи workflow у GitHub Actions мають бути налаштовані секрети `CLOUDFLARE_API_TOKEN` та `CLOUDFLARE_ACCOUNT_ID`.
