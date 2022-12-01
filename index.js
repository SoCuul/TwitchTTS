import tmi from 'tmi.js'
import Enmap from 'enmap'
import JobQueue from 'queuelib'
import say from './say/index.js'

import * as dotenv from 'dotenv'
dotenv.config()

import * as log from './log.js'

//Authentication info
const auth = {
    username: process.env.USERNAME || null,
    token: process.env.TOKEN || null,
    botChannel: process.env.CHANNEL || null
}

//Check if auth info is provided as args
if (process.argv[2]) auth.username = process.argv[2]
if (process.argv[3]) auth.token = process.argv[3]
if (process.argv[4]) auth.botChannel = process.argv[4]

//Verify auth info
if (!auth.username) {
    console.log(log.error('Make sure to provide the bot\'s username.'))
    console.log(log.error('Example: index.js <username> <token> <channel>'))
    process.exit(1)
}
if (!auth.token) {
    console.log(log.error('Make sure to provide an oauth token for the bot.'))
    console.log(log.error('Example: index.js <username> <token> <channel>'))
    process.exit(1)
}
if (!auth.botChannel) {
    console.log(log.error('Make sure to provide the twitch channel the bot should connect to.'))
    console.log(log.error('Example: index.js <username> <token> <channel>'))
    process.exit(1)
}

//Set window title
process.title = `TwitchTTS | Channel: ${auth.botChannel}`

//Initalize enmap
const db = new Enmap({ name: 'config' })

//Create TTS queue
const queue = new JobQueue()

//DB Defaults
const defaults = {
    enabled: false,
    voice: 'Microsoft Richard',
    volume: 100
}

//Ensure db values
db.ensure('enabled', defaults.enabled)
db.ensure('voice', defaults.voice)
db.ensure('volume', defaults.volume)

//Notify user of defaults
console.log(log.info(`TTS enabled: ${db.get('enabled')}`))
console.log(log.info(`TTS voice: ${db.get('voice')}`))
console.log(log.info(`TTS volume: ${db.get('volume')}`))
console.log('')

//Create client
const client = new tmi.Client({
	identity: {
		username: auth.username,
		password: auth.token
	},
	channels: [ auth.botChannel ]
});

//Connect to twitch
try {
    console.log(log.auth(`Authenticating as: ${auth.username}`))
    console.log(log.auth(`Logging into channel: ${auth.botChannel}`))

    await client.connect()

    console.log(log.success('Connected to twitch gateway'))
    console.log('')
}
catch (error) {
    console.log(log.error('Could not connect to twitch gateway. Try restarting the bot.'))
    process.exit(1)
}

//Handle Messages
client.on('message', async (channel, user, message) => {
    //Permissions
    const owner = () => user.username.toLowerCase() === auth.botChannel.toLowerCase()
    const mod = () => user.mod
    //const sub = () => user.subscriber
    //const vip = () => user.badges.vip ? true : false

    //Commands
    if (message.startsWith('!')) {
        //Args
        let args = message.slice(1).trim().split(/ +/g)
        args.shift()

        //Toggle tts state
        if (owner() && message.startsWith('!tts')) {
            const state = db.get('enabled')

            if (state === false) {
                //Set db entry
                db.set('enabled', true)

                //Log
                console.log(log.config('TTS has been enabled'))

                //Respond
                return await client.say(channel, '! TTS has been turned on')
            }
            else {
                //Set db entry
                db.set('enabled', false)

                //Log
                console.log(log.config('TTS has been disabled'))

                //Respond
                return await client.say(channel, '! TTS has been turned off')
            }
        }
        
        //Change tts voice
        else if (owner() && message.startsWith('!voice')) {
            const voice = args.join(' ') || defaults.voice

            //Get voice from db
            const oldVoice = db.get('voice')

            //Set new voice to db
            db.set('voice', voice)

            console.log(log.config(`Voice changed from "${oldVoice}" to "${voice}"`))

            //Respond
            return await client.say(channel, `! Voice changed from "${oldVoice}" to "${voice}"`)
        }

        //Change tts volume
        else if ((owner() || mod()) && message.startsWith('!volume')) {
            const volume = args.join(' ')

            if (!args.length || isNaN(volume) || Number(volume) < 0 || Number(volume) > 100) return client.say(channel, `! Please enter a valid volume level`)

            //Set new volume to db
            db.set('volume', volume)

            //Log
            console.log(log.config(`Volume set to ${volume}%`))

            //Respond
            return await client.say(channel, `! Volume changed to ${volume}%`)
        }
    }
    else {
        //Get db values
        const state = db.get('enabled')
        const voice = db.get('voice')
        const volume = db.get('volume')

        //Log
        console.log(log.message(`${user.username}: ${message}`))

        if (state === true) {
            queue.enqueue((done) => {
                //Speak message
                say.speak(`${user.username} said ${message}`, voice, volume, 1.0, () => {
                    done()
                })
            })
        }
    }
})