exports.createDbEntry = async (ticketID, issueID) => {
	console.info('Creating an entry in the database');
	try {
		await $db.set('Github', {
			[issueID]: {
				'ticketID': ticketID, 
				'comments': [-1]
			}
		});
		await $db.set('Freshdesk', {
			[ticketID]: {
				'issueID': issueID, 
				'conversations': [-1]
			}
        });
        console.info('Successfully created the entry in the database');
	}
	catch(error){
		console.error('Error in creating the entry in the database - ', error);
	}
}


exports.updateDbEntry = async (ticketID, issueID, convoID, commentID, FDmapping, GITmapping) => {
    console.info('Updating an entry in the database');
    try{
        let comments = GITmapping[issueID]['comments'].concat(commentID);
        let conversations = FDmapping[ticketID]['conversations'].concat(convoID);

        await $db.update('Github', 'set', {
            [issueID]: {
                'ticketID': ticketID,
                'comments': comments
            }
        });
        await $db.update('Freshdesk', 'set', {
            [ticketID]: {
                'issueID': issueID,
                'conversations': conversations
            }
        });
        console.info('Successfully updated the entry in the database');
    }
    catch(error){
		console.error('Error in updating the entry in the database - ', error);
	}
}

exports.getDbEntry = async (key) => {
    try{
        let data = await $db.get(key);
        return data;
    }
    catch(error){
        console.error('Error in getting the entry from the database - ', error);
    }
}