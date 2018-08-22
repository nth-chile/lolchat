import React from "react";
import { render } from "react-dom";
import axios from "axios";

class SignUp extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			nickname: "",
			password: "",
			errorMsg: ""
		};
	}

	onSubmit(e) {
		e.preventDefault();

		var { nickname, password } = this.state;

		if (nickname.length > 0 && password.length > 0) {
			axios.post("/action/signup", JSON.stringify({
				nickname,
				password
			}) )
			.then( function (response) { console.log(response) } )
			.catch( function (error) { console.log(error) } );
		} else {
			this.setState({errorMsg: "Registration failed. Try again."})
		}
	}

	render() {
		return (
			<div className="container text-center">
				<h1>lolchat</h1>
				<div className="h5">chat with decent strangers</div>
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
						autocomplete="new-password"
						name="password"
						onChange={e => this.setState({password: e.target.value})}
						type="password"
						value={this.state.password}
					/><br />
					{
						this.state.errorMsg && <div class="alert alert-danger" role="alert">
							{this.state.errorMsg}
						</div>
					}
					<input 
						type="submit"
						onClick={e => this.onSubmit(e)}
						value="chat with a stranger"
					/>
				</form>
			</div>
		);
	}
}

export { SignUp }