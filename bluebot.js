// require the discord.js module
const Discord = require('discord.js');

// create a new Discord client
const client = new Discord.Client();


console.log('Starting BlueBot...');
client.login('Nzc0NzY4ODgwMzUwNTI3NTI4.X6clvw.7bgFok9v_taRyR98xDzS4s-Wd_c');
console.log('Logged into Discord.');

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    client.user.setPresence({ activity: { name: 'video games', type: 'PLAYING' }, status: 'online' })
    console.log('BlueBot online.');
});

client.on('message', async message => {
    // ignore all messages from bots
    if (message.author.bot) return;

    // begin parsing commands starting with '.'
    if (message.content.startsWith('.')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        switch(command){

        }
    }
});
