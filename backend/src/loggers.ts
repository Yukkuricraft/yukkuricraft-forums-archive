import 'winston-daily-rotate-file'
import winston from 'winston'
import AppError from './AppError.js'

export const rootLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: {},
  transports: [
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true,
      maxSize: '10mb',
      level: 'error',
    }),
    new winston.transports.DailyRotateFile({
      dirname: 'logs',
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      zippedArchive: true,
      maxSize: '10mb',
    }),
  ],
  exitOnError: (e: unknown) => {
    return !(e instanceof AppError && e.isOperational)
  },
  handleExceptions: true,
  handleRejections: true,
})

if (process.env.NODE_ENV !== 'production') {
  rootLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.errors({ stack: true }),
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp, stack }) => {
          const ts = String(timestamp).slice(0, 19).replace('T', ' ')
          const strOrStringify = (str: unknown) => (typeof str === 'string' ? str : JSON.stringify(str, null, 2))

          return `${ts || ''} [${level}]: ${strOrStringify(message)} ${strOrStringify(stack || '')}`
        }),
      ),
    }),
  )
}
