const database = require('./database')
const details = require('./details')

exports.createNewTicket = async (data) => {
	console.info('Creating a new ticket in Freshdesk');
	let issueID = data.issue.number;
	let connectionDetails = details.getConnectionDetails();
	let payload = {
		subject: data.issue.title,
		description: 'An issue has been raised in Github. Please check it out.',
		email: 'tester@freshworks.com',
        phone: '9876543210',
        status: 2,
        priority: 1
	}

	let options = {
		headers: connectionDetails.FDheaders,
		body: JSON.stringify(payload)
	}

	try {
		let GITmapping = await database.getDbEntry('Github');

		if (!(issueID in GITmapping)){
			let response = await $request.post(connectionDetails.FDurl, options);
			let ticketID = JSON.parse(response.response).id;

			await database.createDbEntry(ticketID, issueID);
			console.info(`The ticket (${ticketID}) has been successfully created in Freshdesk and is properly linked with the issue in Github`);
		}
	}
	catch(error){
		console.error('Error in creating the ticket in Freshdesk - ', error);
	}
}

exports.createNewConversation = async (data) => {
	console.info('Creating a new conversation under the linked ticket in Freshdesk');
	let issueID = data.issue.number;
	let commentID = data.comment.id;

	let connectionDetails = details.getConnectionDetails();
	let payload = {
		body: data.comment.body,
		private: true
	};

	let options = {
		headers: connectionDetails.FDheaders,
		body: JSON.stringify(payload)
	};
	try {
		let GITmapping = await database.getDbEntry('Github');
		let FDmapping = await database.getDbEntry('Freshdesk');

		if (issueID in GITmapping && !((GITmapping[issueID]['comments']).includes(commentID))){
			let ticketID = GITmapping[issueID].ticketID;
			let response = await $request.post(connectionDetails.FDurl + `/${ticketID}/notes`, options);
			let convoID = JSON.parse(response.response).id;

			await database.updateDbEntry(ticketID, issueID, convoID, commentID, FDmapping, GITmapping);
			console.info(`A conversation(${convoID}) has been successfully created under the linked ticket (${ticketID}) in Freshdesk`);
		}
			
		
	}
	catch(error){
		console.error('Error in creating the conversation in Freshdesk - ', error);
	}
}