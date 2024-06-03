# Sync trading events into Google Calendar

**Navigate through the seas of vast economic events while doing informed trades.**

This project helps to synchronize various economic events like company earnings, dividends, CPI reports, FED meetings and market holidays into Google Calendar.

## Prerequisites

Apart from [Node.js](https://nodejs.org/en/learn/getting-started/how-to-install-nodejs) and [GitHub](https://github.com/git-guides/install-git) you have to
enable **Google Calendar API** in Google Cloud, create there a **Service Account* and invite it to your calendar in Google Calendar.

This can be done by following these steps:
 - Create [Google account](https://www.google.com/).
 - Create [new calendar](https://support.google.com/calendar/answer/37095?hl=en) (name it e.g. `Trading` and copy it's `ID` which can be found in calendar settings).
 - Create [Google Cloud](https://cloud.google.com/) account.
 - Create new [Google Cloud project](https://developers.google.com/workspace/guides/create-project).
 - In Google Cloud [enable Google Calendar API](https://support.google.com/googleapi/answer/6158841?hl=en).
 - In Google Cloud go to **APIs & Services -> Credentials** and create [Service Account](https://cloud.google.com/iam/docs/service-accounts-create).
 - In the Service Account create a new JSON key and copy `client_email` and `private_key` from downloaded JSON file.
 - Share your calendar with this `client_email` and give it rights to **Make changes to events**.

## Installation

Once Node.js and GitHub has been installed you can set up the project using terminal:
```
cd; mkdir trading; cd trading
git clone https://github.com/junajan/trading-events-google-calendar.git
cd trading-events-google-calendar;

npm i;
touch config/local.json
```

Now open file `config/local.json` and create config file:
```json
{
  "calendarId": "{{calendarId}}",
  "symbols": "AAPL,AMZN,MSFT,NVDA,AMD,PG,COST",
  "gcpCredentials": {
    "clientEmail":  "{{serviceAccountEmailFromGCP}}",
    "privateKey": "{{serviceAccountPrivateKEyFromGCP}}"
  }
}
```

Where:
 - `calendarId` is the ID of calendar from Calendar settings.
 - `symbols` is a comma separated list of stock symbols you want to watch.
 - `gcpCredentials.clientEmail` is an email of a Service Account which got access to the calendar.
 - `gcpCredentials.privateKey` is a private key copied from JSON key of this Service Account.

Once this is done, the last step is to accept the invitation sent while sharing the calendar with Service Account.
To do this, just run (has to be called only once):
```
npm run accept-calendar-invitation
```

## Usage

After configuring all necessary components the usage is pretty straightforward:

```bash
# to sync all events while
npm run watch

# to sync only single type of evens
npm run sync-cpi-events
npm run sync-earnings-events
npm run sync-market-holiday-events
npm run sync-dividend-events
npm run sync-fed-events
```

## Sources
 - Google Calendar API documentation: https://developers.google.com/calendar/api/v3/reference/events/list
 - Google Cloud Service Accounts: https://cloud.google.com/iam/docs/service-account-overview
