interface LogJson {
  date: string,
  level: string,
  message: string,
  data?: any,
}

function _log(level: string, message: string, ...data: any[]): void {
  const logFn: (...any: any[]) => void = level === 'ERROR'
    ? console.error
    : console.log;

  const logJson: LogJson = {
    date: (new Date()).toISOString(),
    level,
    message,
  };

  if (data.length === 1 && typeof data[0] === 'object') {
    // eslint-disable-next-line prefer-destructuring
    logJson.data = data[0];
  } else if (data.length) {
    logJson.data = data;
  }

  if (process.env.NODE_ENV === 'localhost') {
    const params: Array<any> = [
      `[${logJson.date}] ${logJson.level}: ${logJson.message}`,
    ];
    if (logJson.data) {
      params.push(data);
    }
    logFn(...params);
  } else {
    logFn(JSON.stringify(logJson));
  }
}

export function error(message: string, ...data: any[]): void {
  _log('ERROR', message, ...data);
}

export function log(message: string, ...data: any[]): void {
  _log('LOG', message, ...data);
}

export function info(message: string, ...data: any[]): void {
  _log('INFO', message, ...data);
}

export function warn(message: string, ...data: any[]): void {
  _log('WARN', message, ...data);
}

export default {
  error,
  warn,
  info,
  log,
};
