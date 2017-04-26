class CandidateInput extends React.Component {
	constructor(props) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
	}
	render() {
		return <textarea
		onChange={this.handleChange}
		id="candidate-input"
		rows="5" cols="70"
		defaultValue="Write all of your candidates on a separate line."
			></textarea>;

	}
	handleChange(event) {
		// TODO: filter empty-string candidates
		// TODO: uniquify candidate names
		const candidates = event.target.value.split('\n');
		this.props.onChange(candidates);
	}
}
class Ballot extends React.Component {
	constructor(props) {
		super(props);
		this.state = {ranks: {}, duplicates: 1};
		this.handleOptionChange = this.handleOptionChange.bind(this);
		this.handleDuplicateChange = this.handleDuplicateChange.bind(this);
	}
	handleOptionChange(candidate, rank) {
		this.state.ranks[candidate] = rank;
		this.setState(this.state);
		this.props.onChange(this.props.ballotNumber, this.state.duplicates, this.state.ranks);
	}
	handleDuplicateChange(duplicates) {
		this.state.duplicates = duplicates
		this.setState(this.state);
		this.props.onChange(this.props.ballotNumber, this.state.duplicates, this.state.ranks);
	}
	render() {
		if (this.props.candidates.length == 0 || this.props.candidates[0].length == 0) {
			return <table></table>
		}
		const outerThis = this;
		const candidateHeader = this.props.candidates.map(function(candidate, i) {
			return <td key={i}><b>{candidate}</b></td>;
		});

		const candidateOptionss = this.props.candidates.map(function(candidate, i) {
			return <td key={i}>
				<CandidateOptions candidate={candidate} n={outerThis.props.candidates.length} onChange={outerThis.handleOptionChange} />
				</td>;
		});
		return <table id="ballot">
			<thead><tr>
			<td>Count</td>
			{candidateHeader}
		</tr></thead>
			<tbody><tr>
			<td><BallotDuplicate onChange={this.handleDuplicateChange} /></td>
			{candidateOptionss}
		</tr></tbody>
			</table>;
	}
}
class BallotDuplicate extends React.Component {
	constructor(props) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
	}
	handleChange(event) {
		const value = _.parseInt(event.target.value);
		if (value > 0) {
			this.props.onChange(value);
		}
		// TODO: else... raise warning
	}
	render() {
		return <input type="number" onKeyUp={this.handleChange} />;
	}
}
class CandidateOptions extends React.Component {
	constructor(props) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
	}
	handleChange(rank) {
		this.props.onChange(this.props.candidate, rank);
	}
	render() {
		const outerThis = this;
		const options = _.range(1, this.props.n + 1).map(function(m) {
			return <div key={m}><CandidateOption candidate={outerThis.props.candidate} m={m} onChange={outerThis.handleChange} /></div>;
		});
		return <form>{options}</form>;
	}
}
class CandidateOption extends React.Component {
	constructor(props) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
	}
	handleChange() {
		this.props.onChange(this.props.m);
	}
	render() {
		return <span>
			<input type="radio" name={this.props.candidate} value={this.props.m} onChange={this.handleChange} />
			{this.props.m} <br />
			</span>;
		// TODO: Make sure user does not check two numbers for one candidate
	}
}
class BallotCount extends React.Component {
	constructor(props) {
		super(props);
		this.handleChange = this.handleChange.bind(this);
	}
	handleChange(event) {
		const value = _.parseInt(event.target.value);
		if (value > 0) {
			this.props.onChange(value);
		}
		// TODO: else... raise warning
	}
	render() {
		return <input type="number" onKeyUp={this.handleChange} />;
	}
}
class Election extends React.Component {
	constructor(props) {
		super(props);
		this.state = {candidates: [], ballotCount: 1, ballots: {}}
		this.handleCandidateChange = this.handleCandidateChange.bind(this);
		this.handleBallotChange = this.handleBallotChange.bind(this);
		this.handleBallotCountChange = this.handleBallotCountChange.bind(this);
	}
	handleCandidateChange(candidates) {
		// TODO: save state when candidate names are edited
		// TODO: but remove state when the number of candidates changes
		this.state.candidates = candidates;
		this.setState(this.state);
		// TODO: is this ok react code for changing the state?
	}
	handleBallotChange(ballotNumber, duplicates, ranks) {
		this.state.ballots[ballotNumber] = {ranks: ranks, duplicates: duplicates};
		this.setState(this.state);
	}
	handleBallotCountChange(ballotCount) {
		this.state.ballotCount = ballotCount;
		this.setState(this.state);
	}
	render() {
		var results = <p>No results yet</p>;
		if (this.state.candidates.length >= 2 && _.keys(this.state.ballots).length >= 1) {
			results = show_irv(_.cloneDeep(this.state.candidates), _.cloneDeep(this.state.ballots));
		}
		const outerThis = this;
		const ballots = _.range(0, this.state.ballotCount).map(function(ballotNumber) {
			return <Ballot candidates={outerThis.state.candidates} onChange={outerThis.handleBallotChange} key={ballotNumber} ballotNumber={ballotNumber} />;
		});
		return  <div>
			<p>
			<CandidateInput onChange={this.handleCandidateChange} />
			</p>
			<p>
			<BallotCount onChange={this.handleBallotCountChange} />
			</p>
			{ballots}
		{results}
		</div>;
	}
}
function runoff(ballots, candidate_a, candidate_b) {
	var a_count = 0;
	var b_count = 0;
	ballots.forEach(function(ballot) {
		if (ballot.ranks[candidate_a] > ballot.ranks[candidate_b]) {
			a_count += ballot.duplicates;
		}
		if (ballot.ranks[candidate_b] > ballot.ranks[candidate_a]) {
			b_count += ballot.duplicates;
		}
	});
	winner = undefined;
	if (a_count > b_count) {
		winner = candidate_a;
	}
	if (b_count > a_count) {
		winner = candidate_b;
	}
	return {winner: winner, a_count: a_count, b_count: b_count};
}

function show_irv(candidates, ballots) {
	var ballotArray = _.values(ballots);
	const results = elect_irv(_.cloneDeep(candidates), ballotArray);
	const candidateRow = candidates.map(function(candidate, i) {
		return <td key={i}><b>{candidate}</b></td>;
	});
	const rows = results.map(function(result, key) {
		const row = candidates.map(function(candidate, key) {
			if (result.candidateFirstCount[candidate] !== undefined) {
				if (candidate === result.winner) {
					return <td key={key}><span className="winner">{result.candidateFirstCount[candidate]}</span></td>;
				}
				if (candidate === result.eliminated && result.winner === undefined) {
					return <td key={key}><span className="eliminated">{result.candidateFirstCount[candidate]}</span></td>;
				}
				return <td key={key}>{result.candidateFirstCount[candidate]}</td>;
			} else {
				return <td key={key}>-</td>;
			}
		});
		return <tr key={key}>{row}</tr>;
	});
	return <table>
		<thead><tr>{candidateRow}</tr></thead>
		<tbody>{rows}</tbody>
		</table>;
}
ReactDOM.render(
		<Election />,
	document.getElementById('root')
);
