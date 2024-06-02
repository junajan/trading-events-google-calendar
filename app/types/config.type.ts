interface ConfigType {
  calendarId: string,
  symbols: string,
  earningsHeadsupDays: string,
  gcpCredentials: {
    clientEmail: string,
    privateKey: string,
  }
}

declare module 'config' {
  const config: ConfigType;
  export = config;
}
