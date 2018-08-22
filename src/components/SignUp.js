import React from "react";
import { render } from "react-dom";

class SignUp extends React.Component {
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
				<form>
					<label htmlFor="nickname">nickname</label>
					<input 
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
						type="submit"
						onClick={e => this.onSubmit}
						value="chat with a stranger"
					/>
				</form>
			</div>
		);
	}
}

export { SignUp }