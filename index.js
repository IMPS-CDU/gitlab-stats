const fetch = require('node-fetch');
const commander = require('commander');

function getRepositories(token, baseUrl) {
	const api = '/api/v4/projects/?membership=true';
	return fetch(`${baseUrl}${api}`, {
		method: 'GET',
		headers: {
			'Private-Token': token
		}
	})
		.then((response) => response.json())
		.then((data) => data.map((project) => ({
			description: project.description,
			name: project.name,
			id: project.id,
			path: project.path_with_namespace,
			url: project.web_url
		})));
}

function getProjectStats(config) {
	const {id, token, baseUrl, since, until} = config;
	const api = `/api/v4/projects/${id}/repository/commits?with_stats=true`;
	let queryString = '';
	if(since) {
		const sinceDate = new Date(since);
		queryString += `&since=${sinceDate.toISOString()}`;
	}
	if(until) {
		const untilDate = new Date(until);
		queryString += `&until=${untilDate.toISOString()}`;
	}

	return fetch(`${baseUrl}${api}${queryString}`, {
		method: 'GET',
		headers: {
			'Private-Token': token
		}
	})
		.then((response) => response.json())
		.then((data) => data.reduce(
			(acc, commitData) => ({
				commits: ++acc.commits,
				additions: acc.additions + commitData.stats.additions,
				deletions: acc.deletions + commitData.stats.deletions,
				first: acc.first && acc.first < commitData.created_at ? acc.first : commitData.created_at,
				last: acc.last && acc.last > commitData.created_at ? acc.last : commitData.created_at
			}),
			{
				commits: 0,
				additions: 0,
				deletions: 0,
				first: null
			}
		))
}

function printStats(data) {
	const totals = {
		commits: 0,
		additions: 0,
		deletions:0
	};

	data.forEach((project) => {
		console.log(`Name: ${project.name}`);
		console.log(`	Commits: ${project.stats.commits}`);
		console.log(`	New lines: ${project.stats.additions}`);
		console.log(`	Deleted lines: ${project.stats.deletions}`);
		console.log(`	First commit: ${project.stats.first}`);
		console.log(`	Last Commit: ${project.stats.last}`);
		console.log('\r\r');

		totals.commits += project.stats.commits;
		totals.additions += project.stats.additions;
		totals.deletions += project.stats.deletions;
	});

	console.log('Totals');
	console.log(`	Commits: ${totals.commits}`);
	console.log(`	New lines: ${totals.additions}`);
	console.log(`	Deleted lines: ${totals.deletions}`);
}

function run() {
	commander
		.option('-t, --token <token>', 'Personal access token')
		.option('-u, --url <url>', 'Gitlab base URL')
		.option('-s, --since [since]', 'Date to load commits since (optional)')
		.option('-e, --until [until]', 'Date to load commits until (optional)')
		.parse(process.argv);

	const token = commander.token;
	const baseUrl = commander.url;

	const dates = {};
	if(commander.since) {
		dates.since = commander.since;
	}

	if(commander.until) {
		dates.until = commander.until;
	}


	getRepositories(token, baseUrl)
		.then((data) => data.map((project) => {
			return getProjectStats(Object.assign({id: project.id, token, baseUrl}, dates))
				.then((stats) => Object.assign({}, project, {stats}))
		}))
		.then((promises) => Promise.all(promises))
		.then((data) => printStats(data));
}


run();
