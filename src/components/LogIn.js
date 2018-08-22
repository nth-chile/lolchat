import React from "react";
import { render } from "react-dom";
import { Link } from "react-router-dom";

class LogIn extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			nickname: "",
			password: ""
		};
	}

	onSubmit() {

	}

	render() {
		return (
			<div className="container text-center">
				<h1>lolchat</h1>
				<div className="h5">chat with decent strangers</div>
				<div>log in or <Link to={'/signup'}>sign up</Link></div>
				<form>
					<label htmlFor="nickname">nickname</label>
					<input
						autoComplete="nickname"
						name="nickname"
						onChange={e => this.setState({nickname: e.target.value})}
						type="text"
						value={this.state.nickname}
					/><br />
					<label htmlFor="password">password</label>
					<input 
						name="password"
						onChange={e => this.setState({password: e.target.value})}
						type="password"
						value={this.state.password}
					/><br />
					<input 
						autoComplete="new-password"
						type="submit"
						onClick={e => this.onSubmit}
						value="chat with a stranger"
					/>
				</form>
			</div>
		);
	}
}

export { LogIn }