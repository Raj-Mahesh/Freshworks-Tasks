const details = require('./details');
const database = require('./database');
const fdActions = require('./fdActions');

exports = {
	events: [
		{ event: "onTicketCreate", callback: "onTicketCreateCallback" },
		{ event: 'onConversationCreate', callback: 'onConversationCreateCallback' },
		{ event: 'onAppInstall', callback: 'onAppInstallHandler' },
		{ event: 'onExternalEvent', callback: 'onWebhookCallbackHandler' },
		{ event: 'onAppUninstall', callback: 'onAppUninstallHandler' }
	],

	onTicketCreateCallback: async function(payload){
		console.info('A ticket has been created in Freshdesk');
		let ticketID = payload.data.ticket.id;
		let connectionDetails = details.getConnectionDetails();
		let content = {
			'title': payload.data.ticket.subject
		}

		let options = {
			headers: connectionDetails.GITheaders,
			isOAuth: true,
			body: JSON.stringify(content)
		}
		try {
			console.info('Creating an issue in Github');
			let FDmapping = await database.getDbEntry('Freshdesk');

			if (!(ticketID in FDmapping)){
				let responseData = await $request.post(connectionDetails.GITurl, options);
				let issueID = JSON.parse(responseData.response).number;

				await database.createDbEntry(ticketID, issueID);
				console.info(`Successfully created an issue(${issueID}) in Github`);
			}
		}
		catch(error){
			console.error('error in creating an issue in Github -', error)
		}

	},
	
 	onConversationCreateCallback: async function(payload) {
		console.info('A conversation has been created in Freshdesk');
		let conversationData = payload.data.conversation;
		let ticketID = conversationData.ticket_id;
		let convoID = conversationData.id;
		let connectionDetails = details.getConnectionDetails();

		let content = {
			'body': conversationData.body_text
		}
		let options = {
			'headers': connectionDetails.GITheaders,
			'isOAuth': true,
			'body': JSON.stringify(content)
		}
		try{
			console.info('Creating a comment under the linked issue in Github');
			let FDmapping = await database.getDbEntry('Freshdesk');
			let GITmapping = await database.getDbEntry('Github');

			if (ticketID in FDmapping && !((FDmapping[ticketID]['conversations']).includes(convoID))){
				let issueID = FDmapping[ticketID].issueID;
				let response = await $request.post(connectionDetails.GITurl + `/${issueID}/comments`, options);
				let commentID = JSON.parse(response.response).id;

				await database.updateDbEntry(ticketID, issueID, convoID, commentID, FDmapping, GITmapping);
				console.info(`Successfully created a comment(${commentID}) under the linked issue in Github`)
			}
		}
		catch(error){
			console.error('Error in creating a comment in Github - ', error);
		}

	},

	onAppInstallHandler: async function(){
		console.info('App is getting installed');
		let uniqueURL;
		try{
			uniqueURL = await generateTargetUrl();
		}
		catch(error){
			console.error('Error in generating URL - ', error);
			renderData({message: "Error in generating URL."});
			
		}

		let connectionDetails = details.getConnectionDetails();
		
		let url = connectionDetails.GITurl.slice(0,-6) + 'hooks';
		let options = {
			headers: connectionDetails.GITheaders,
			isOAuth: true,
			json: {
				"name": "web",
				"active": true,
				"events": [
					"issue_comment",
					"issues"
				],
				"config": {
					"url": uniqueURL,
					"content_type": "json"
				}
			}
		}
		try{
			await $request.post(url, options);
			await database.createDbEntry(0, 0);
			console.info('Successfully linked the wekhook callback url');
			renderData();
		}

		catch(error){
			console.error('Error in setting the webhook url -', error);
			renderData({message: "Error in installing the app."});
		}
		
	},

	onWebhookCallbackHandler: async function(payload){
		let data = payload.data;
		let type = data.action;
		console.info('A change has been triggered in github');
		try {
			if (type === 'opened'){
				await fdActions.createNewTicket(data)
			}
			else if (type === 'created'){
				await fdActions.createNewConversation(data);
			}
		}
		catch(error){
			//When other events are triggered in the issues part
			console.error('Error occuring at webhook callback handler -', error);
		}
		
	},

	onAppUninstallHandler: async function(){
		console.info('App is getting uninstalled');
		let connectionDetails = details.getConnectionDetails();
		
		let url = connectionDetails.GITurl.slice(0,-6) + 'hooks';
		let options = {
			headers: connectionDetails.GITheaders,
			isOAuth: true
		}

		try{
			let data = await $request.get(url, options);
			let response = JSON.parse(data.response);
			let activeWebhookID = (response.find(each => each.last_response.code === 200)).id;
			await $request.delete(url + `/${activeWebhookID}`, options);
			console.info('App is successfully uninstalled');
			renderData();
		}
		catch(error){
			console.error('Error in removing the webhook url -', error);
			renderData({message: "Error in uninstalling the app."});
		}

	}

};
	