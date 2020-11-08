//API keys kept in seperate file for security
const fs = require('fs');
let keys = JSON.parse(fs.readFileSync('keys.json'));

// require the node-fetch module
const fetch = require('node-fetch');

//require the form-data module
const FormData = require('form-data');

// require the discord.js module
const Discord = require('discord.js');

// create a new Discord client
const discordClient = new Discord.Client();

console.log('Starting BlueBot...');
discordClient.login(keys.discordToken);
console.log('Logged into Discord.');

// when the client is ready, run this code
// this event will only trigger one time after logging in
discordClient.once('ready', () => {
    discordClient.user.setPresence({ activity: { name: 'you like a fiddle', type: 'PLAYING' }, status: 'online' })
    console.log('BlueBot online.');
});

discordClient.on('message', async message => {
    // ignore all messages from bots
    if (message.author.bot) return;

    // begin parsing commands starting with '.'
    if (message.content.startsWith('.')) {
        const args = message.content.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        switch (command) {
            case "tweets":
                fetch('https://api.twitter.com/2/tweets/search/recent?query=from:TeamLiquidLoL', {
                    method: 'get',
                    headers: { 'Authorization': keys.twitterKey },
                })
                    .then(res => res.json())
                    .then(json => {
                        message.channel.send('Latest Tweet from @TeamLiquidLol:\nhttps://twitter.com/TeamLiquidLoL/status/' + json.data[0].id);
                    });
                break;
            case "player":
                let form = new FormData();
                form.append('wiki', args[0]);
                form.append('apikey', keys.liquipediaKey);
                form.append('conditions', `[[id::${args[1].replace('_', ' ')}]]`);

                fetch('https://api.liquipedia.net/api/v1/player', {
                    method: 'POST', body: form
                }).then(res => res.json()).then(players => {
                    let nationality = players.result[0].nationality;
                    if (players.result[0].nationality2 !== "") {
                        nationality += ', ' + players.result[0].nationality2;
                    }
                    if (players.result[0].nationality3 !== "") {
                        nationality += ', ' + players.result[0].nationality3;
                    }
                    let embed = new Discord.MessageEmbed()
                        .setAuthor('Liquipedia DB', 'https://liquipedia.net/commons/extensions/TeamLiquidIntegration/resources/pagelogo/liquipedia_icon_menu.png', 'https://liquipedia.net/')
                        .setTitle(players.result[0].id)
                        .setURL(`https://liquipedia.net/${players.result[0].wiki}/${players.result[0].pagename}`)
                        .setDescription('Alternate IDs: ' + players.result[0].alternateid)
                        .setColor('#0E2240')
                        .addField('Name', players.result[0].name, true);
                    if (players.result[0].romanizedname !== '') {
                        embed.addField('Romanized Name', players.result[0].romanizedname, true);
                    }
                    embed.addField('Nationality', nationality);
                    if (players.result[0].birthdate !== '1970-01-01') {
                        let dob = players.result[0].birthdate.split("-");
                        let age;
                        current = new Date();
                        if (current.getMonth() > parseInt(dob[1]) && current.getDate > parseInt(dob[2])) {
                            age = current.getFullYear() - parseInt(dob[0]);
                        }
                        else {
                            age = current.getFullYear() - parseInt(dob[0]) - 1;
                        }
                        embed.addField('Age', age);
                    }
                    if (players.result[0].team !== '') {
                        embed.addField('Team', players.result[0].team);
                    }
                    if (players.result[0].links.twitter !== '') {
                        fetch('https://api.twitter.com/1.1/users/show.json?screen_name=' + players.result[0].links.twitter, {
                            method: 'get',
                            headers: { 'Authorization': keys.twitterKey },
                        })
                            .then(res => res.json())
                            .then(json => {
                                embed.setThumbnail(json.profile_image_url);
                                message.channel.send(embed);
                            });
                    }
                });
                break;
            case "team":
                let teamForm = new FormData();
                teamForm.append('wiki', args[0]);
                teamForm.append('apikey', keys.liquipediaKey);
                teamForm.append('conditions', `[[name::${args[1].replace('_', ' ')}]]`);

                fetch('https://api.liquipedia.net/api/v1/team', {
                    method: 'POST', body: teamForm
                }).then(res => res.json()).then(team => {
                    let embed = new Discord.MessageEmbed()
                        .setAuthor('Liquipedia DB', 'https://liquipedia.net/commons/extensions/TeamLiquidIntegration/resources/pagelogo/liquipedia_icon_menu.png', 'https://liquipedia.net/')
                        .setTitle(team.result[0].name)
                        .setURL(`https://liquipedia.net/${team.result[0].wiki}/${team.result[0].pagename}`)
                        .setThumbnail(team.result[0].logourl)
                        .setColor('#0E2240');
                    let playerForm = new FormData();
                    playerForm.append('wiki', args[0]);
                    playerForm.append('apikey', keys.liquipediaKey);
                    playerForm.append('conditions', `[[team::${args[1].replace('_', ' ')}]]`);

                    fetch('https://api.liquipedia.net/api/v1/player', {
                        method: 'POST', body: playerForm
                    }).then(res => res.json()).then(players => {
                        let playerList = '';
                        players.result.forEach(p => {
                            if (p.extradata != null && p.extradata.role != null) {
                                playerList += `${p.id} (${p.extradata.role})\n`;
                            }
                            else {
                                playerList += p.id + '\n';
                            }
                        });
                        embed.addField('Players', playerList);
                        message.channel.send(embed);
                    });
                });
                break;
            case "recent":
                let matchForm = new FormData();
                matchForm.append('wiki', 'leagueoflegends');
                matchForm.append('apikey', keys.liquipediaKey);
                matchForm.append('conditions', `[[opponent1::Team Liquid]]OR[[opponent2::Team Liquid]]`);
                matchForm.append('order', 'date DESC');
                matchForm.append('limit', args[0]);

                fetch('https://api.liquipedia.net/api/v1/match', {
                    method: 'POST', body: matchForm
                }).then(res => res.json()).then(matches => {
                    let embed = new Discord.MessageEmbed()
                        .setAuthor('Liquipedia DB', 'https://liquipedia.net/commons/extensions/TeamLiquidIntegration/resources/pagelogo/liquipedia_icon_menu.png', 'https://liquipedia.net/')
                        .setTitle('Team Liquid Recent Games')
                        .setURL(`https://liquipedia.net/leagueoflegends/Team_Liquid/Played_Matches`)
                        .setThumbnail('https://liquipedia.net/commons/images/thumb/7/7e/Team_Liquid_2020.png/320px-Team_Liquid_2020.png')
                        .setColor('#0E2240');
                    for (let i = 0; i < matches.result.length; i++) {
                        embed.addField(matches.result[i].pagename.replace(/\/|\_/g, ' '), `${matches.result[i].opponent1}|| (${matches.result[i].opponent1score}) || vs ${matches.result[i].opponent2}|| (${matches.result[i].opponent2score}) ||`);
                    }
                    message.channel.send(embed);
                });
                break;
            case "help":
                let embed = new Discord.MessageEmbed()
                    .setTitle('BlueBot Commands')
                    .setDescription('Note: player names or team names consisting of multiple words can be join by replacing whitespace with underscores (_).')
                    .addFields(
                        { name: 'tweets', value: 'Displays the most recent @TeamLiquidLoL tweet.\nExample: .tweets' },
                        { name: 'player <wiki> <name>', value: 'Displays player information on the given Liquipedia wiki.\nExample: .player smash Hungrybox' },
                        { name: 'team <wiki>', value: 'Displays a team\'s roster for the given Liquipedia wiki.\nExample: .team counterstrike Team_Liquid' },
                        { name: 'recent <number>', value: 'Displays the most recent <number> of games that Team Liquid\'s League of Legends team has played, with spoiler protection.\nExample: .recent 5' },
                        { name: 'Legal wiki names', value: 'Legal wiki names include but are not limited to:\nstarcraft2\nleagueoflegends\nhearthstone\ncounterstrike\ndota2\nsmash\nfighters\npubg\nrainbowsix\nclashroyale\nfortnite\napexlegends\nfreefire\nrocketleague\nvalorant' }
                    )
                    .setColor('#0E2240');
                message.channel.send(embed);
        }
    }
});
