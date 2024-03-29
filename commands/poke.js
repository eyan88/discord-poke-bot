const fs = require('fs');
const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const { type } = require('os');
const { WebhookClient } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poke')
        .setDescription('Returns a random Pokemon or specified Pokemon if provided')
        .addStringOption(option =>
            option.setName('string')
                .setDescription('Pokemon Name or ID')
                .setRequired(false)),
    async execute(interaction) {
        let pokemonName = getPokemonName(interaction);
        console.log(pokemonName);
        try {
            let pokemon, pokemonSpecies, pokemonData, speciesData;

            // Behavior when given Pokemon with alternate forms
            if(typeof(pokemonName) !== 'number' && pokemonName.includes('-')) {
                pokemon = `https://pokeapi.co/api/v2/pokemon/${pokemonName}`;
                pokemonData = await fetch(pokemon);
                pokemonData = await pokemonData.json();

                speciesData = await fetch(pokemonData.data.species.url);
                speciesData = await speciesData.json();
                
                pokemonName = pokemonData.data.name;
            } else {
                pokemonSpecies = `https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`;
                speciesData = await fetch(pokemonSpecies);
                speciesData = await speciesData.json();

                pokemonData = speciesData.varieties[0].pokemon.url;
                pokemonData = await fetch(pokemonData)
                pokemonData = await pokemonData.json();
                pokemonName = pokemonData.name;
            }
            
            // embed info
            const pokemonInfoEmbed = new EmbedBuilder()
                .setColor(0xFFFFFF)
                .setTitle(capitalizeText(pokemonData.name))
                .setURL(getBulbapediaURL(pokemonName))
                .setAuthor({name: 'National Dex # : ' + pokemonData.id, iconURL: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'})
                .setDescription(getFlavorText(speciesData))
                .setThumbnail(pokemonData.sprites.versions['generation-v']['black-white'].animated.front_default)
                .addFields(
                    { name: '\u200B', value: '\u200B' },
                    { name: 'Regular field title', value: 'Some value here' },
                    { name: 'Type', value: getTypes(pokemonData), inline: true },
                    { name: 'Secondary Type', value: 'text', inline: true },
                )
                .setTimestamp()
                .setFooter({text:'via PokeAPI v2', iconURL: 'https://i.imgur.com/AfFp7pu.png'});
            
            interaction.reply({ embeds: [pokemonInfoEmbed], ephemeral: false });

        } catch (err) {
            await interaction.reply({content: 'Invalid pokemon returned, try again', ephemeral: true});
        }
    },
};

// Returns a pokemon name or ID, if name/ID isn't provided, selects a random ID
const getPokemonName = (interaction) => {
    let name;
    if (!interaction.options.get('string')) {
        name = getRandomNum(898);
    } else {
        name = interaction.options.get('string').value;
        name = name.toLowerCase();
    }
    return name;
};

// Gets Bulbapedia Wiki URL for pokemonName parameter
const getBulbapediaURL = (pokemonName) => {
    console.log(pokemonName);
    let urlAttachment = pokemonName.toLowerCase();
    if (urlAttachment.includes('-')) {
        urlAttachment = urlAttachment.slice(0, urlAttachment.indexOf('-'));
    }
    return `https://bulbapedia.bulbagarden.net/wiki/${urlAttachment}`;
}

// Gets Flavor Text from JSON pokemon species data
const getFlavorText = (speciesData) => {
    let lang = '';
    let rng;
    while (lang !== 'en') {
        rng = getRandomNum(speciesData.flavor_text_entries.length - 1);
        lang = speciesData.flavor_text_entries[rng].language.name;
    }
    return speciesData.flavor_text_entries[rng].flavor_text;
};

// Gets Types from JSON pokemon data
const getTypes = (data) => {
    let typesString = ''
    if(data.types.length == 1) {
        typesString = capitalizeText(data.types[0].type.name);
    } else {
        typesString = capitalizeText(data.types[0].type.name) + "/" + capitalizeText(data.types[1].type.name);
    }
    return typesString
};
// Helper function to capitalize text (e.g. when retrieving from JSON)
const capitalizeText = (text) => {
    if (typeof (text) === 'undefined') {
        return 'N/A';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
};

// returns a random number from 0 to @param max
const getRandomNum = (max) => {
    return Math.floor(Math.random() * max);
};