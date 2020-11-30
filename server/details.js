exports.getConnectionDetails = () => {
	let details = { 
		FDurl: "https://<%= iparam.freshdeskDomain %>.freshdesk.com/api/v2/tickets",
		FDheaders: { "Authorization": "Basic <%= encode(iparam.freshdeskAPIkey) %>",
					 "content-type": "application/json"
		},

		GITurl: 'https://api.github.com/repos/Raj-Mahesh/Sample/issues',
		GITheaders: { 'Authorization': 'token <%= access_token %>',
					   'User-Agent': 'authentication',
					   'Accept': 'application/vnd.github.v3+json'
		}
	}
	return details;
}