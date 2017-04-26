function firstPlace(candidates, ballot) {
	// TODO: reject null ballots
	return _.minBy(
		candidates.map(function(candidate) {
			return {candidate: candidate, score: ballot.ranks[candidate], duplicates: ballot.duplicates};
		}), 'score');
}

function elect_irv(candidates_, ballots_) {
	var candidates = _.cloneDeep(candidates_);
	const ballots = _.cloneDeep(ballots_);
	var results = [];

	while (winner === undefined) {
		var minCount = undefined, minCandidate = undefined;
		// ballotFirsts[i].candidate is the first-choice of this ballot,
		// ballotFirsts[i].duplicates is the number of them
		var ballotFirsts = ballots.map(_.partial(firstPlace, candidates));

		// candidateFirstCount[Candidate] is the count of first-choices
		var candidateFirstCount = {}
		ballotFirsts.forEach(function(ballotFirst) {
			if (candidateFirstCount[ballotFirst.candidate] === undefined) {
				candidateFirstCount[ballotFirst.candidate] = 0;
			}
			candidateFirstCount[ballotFirst.candidate] += ballotFirst.duplicates;
		});

		// TODO: count only valid and non-null ballots 
		const n = _.sum(ballots.map(_.property('duplicates')));
		// TODO: detect ties
		const min = _.minBy(_.toPairs(candidateFirstCount), _.property(1));
		const max = _.maxBy(_.toPairs(candidateFirstCount), _.property(1));
		var eliminated = undefined;
		var winner = undefined;
		if (max[1] > n / 2) {
			winner = max[0];
		} else {
			eliminated = min[0];
			candidates = _.pull(candidates, eliminated);
		}

		results.push({candidateFirstCount: candidateFirstCount, winner: winner, eliminated: eliminated});
		if (results.length > 10) {
			break;
		}
	}
	return results;
}

const candidates = ["jack","jane","joe"]
const ballots = [{"ranks":{"jack":1,"jane":2,"joe":3},"duplicates":10}, {"ranks":{"jane":1,"joe":2,"jack":3},"duplicates":9}, {"ranks":{"joe":1,"jack":2,"jane":3},"duplicates":11}]
console.log(elect_irv(candidates, ballots));
