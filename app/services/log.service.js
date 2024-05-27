function _log(level, message, ...data) {
  const logFn = level === 'ERROR'
    ? console.error
    : console.log;

  const logJson = {
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
    const params = [
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

export function error(message, ...data) {
  _log('ERROR', message, ...data);
}

export function log(message, ...data) {
  _log('LOG', message, ...data);
}

export function info(message, ...data) {
  _log('INFO', message, ...data);
}

export function warn(message, ...data) {
  _log('WARN', message, ...data);
}

export default {
  error,
  warn,
  info,
  log,
};
