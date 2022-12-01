//Modules
import chalk from 'chalk'

export const info = (message, prefix) => chalk.cyan(
    `[${prefix ? prefix : 'Info'}] ${message}`
)
export const success = (message, prefix) => chalk.green(
    `[${prefix ? prefix : 'Success'}] ${message}`
)
export const error = (message, prefix) => chalk.red(
    `[${prefix ? prefix : 'Error'}] ${message}`
)
export const config = (message, prefix) => chalk.cyan(
    `[${prefix ? prefix : 'Config'}] ${message}`
)
export const auth = (message, prefix) => chalk.magenta(
    `[${prefix ? prefix : 'Auth'}] ${message}`
)
export const message = (message, prefix) => chalk.blue(
    `[${prefix ? prefix : 'Message'}] ${message}`
)