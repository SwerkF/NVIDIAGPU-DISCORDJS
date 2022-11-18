const { Client, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const { token } = require('./config.json')

const fs = require('node:fs');
const axios = require('axios');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async c => {
	
	console.log(`Ready! Logged in as ${c.user.tag}`);
	//Définir le guild et channel ou envoyer les messages:
	const channel = client.guilds.cache.get("710601053212508240").channels.cache.get("1042539916141269003")
	
	//Récupérer les données de l'API toutes les 10 secondes:
	setInterval(() => {

		//Lire le fichier gpu.json qui contient la liste des gpus Nvidia
		let gpusJSON = fs.readFileSync('./gpu.json', (err, data) => {
			return data;
		})

		gpusJSON = JSON.parse(gpusJSON)

		//Parcourir les cartes graphiques contenue dans le gpu.json
		Object.values(Object.values(gpusJSON)).forEach(async g => {

			//Récupérer les données de l'API
			axios.get(`https://api.store.nvidia.com/partner/v1/feinventory?skus=${g.code}&locale=fr-fr`)
				.then(async res => {
				//Si la carte graphique est disponible et que notre cg dans le gpu.json est pas active
				if(res.data.listMap[0].is_active == "true" && g.active != "true") {

					//On change les états des deux variables
					g.active = "true";

					let grade = `<@&${g.gradeID}>` || ""
					//On prépare un embed dans avec un bouton de redirection
					const row = new ActionRowBuilder()
						.addComponents(
							new ButtonBuilder()
								.setLabel('Acheter')
								.setURL(`https://store.nvidia.com/fr-fr/geforce/store/?page=1&limit=9&locale=fr-fr&manufacturer=NVIDIA&gpu=${g.url}`)
								.setStyle(ButtonStyle.Link),
						);
					
					const exampleEmbed = new EmbedBuilder()
						.setTitle(`DROP DE ${g.nom} FE!`)
						.setColor('#2ae300')
						.addFields(
							{ name: 'Prix', value: `${res.data.listMap[0].price}€`, inline: true },
						)

					//On envoie le message
					await channel.send({ content: grade, embeds: [exampleEmbed],  components: [row]}); 

				}

				if (res.data.listMap[0].is_active == "false" && g.active == "false") {
					//Si la carte graphique n'est pas disponible et que la variable active est à false on ne fait rien
					//Si besoin on peut écrire quelque chose ici
				}
				

				//Si la carte graphique n'est pas disponible et que la variable active 
				if(res.data.listMap[0].is_active == "false" && g.active == "true") {
					//On change la variable active à false
					g.active = "false";

					//On prépare un embed 
					const exampleEmbed = new EmbedBuilder()
						.setTitle(`LE DROP DE ${g.nom} FE EST FINI!`)
						.setColor("#ff0022")

					//On envoie le message
					await channel.send({ embeds: [exampleEmbed]}); 

				}
			})
		})
		//On écrit dans le fichier gpu.json les nouvelles valeurs après 5 secondes afin de s'assurer que les requêtes d'API aient le temps de s'effectuer
		setTimeout(() => {

			fs.writeFileSync('./gpu.json', JSON.stringify(gpusJSON, null, 2))
			console.log('Saved')
		}, 5000)

	}, 10000)
	

});

client.login(token);

