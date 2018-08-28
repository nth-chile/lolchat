import React from "react";
import { render } from "react-dom";
import { Link, Redirect } from "react-router-dom";
import axios from "axios";

class LogIn extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			nickname: "",
			password: "",
			errorMsg: "",
			toChat: false
		};
	}

	onSubmit(e) {
		e.preventDefault();

		var { nickname, password } = this.state;

		if (nickname.length > 0 && password.length > 0) {
			axios.post("/action/login", {
				nickname,
				password
			})
			.then((response) => {
				console.log(response);

				switch (response.data.action) {
					case "ACCOUNT_NONEXISTENT":
						this.setState({errorMsg: "Are you sure you have an account? That nickname is unregistered."});
						break;
					case "LOGIN_SUCCESS":
						this.props.setAuthNickname(nickname);
						this.setState({toChat: true});
						break;
					case "WRONG_PASSWORD":
						this.setState({errorMsg: "Incorrect password."});
						break;
					default:
						this.setState({errorMsg: "Login failed. Please try again later."});
				}
			})
			.catch( function (error) { console.log(error) } );
		} else {
			this.setState({errorMsg: "I think you left some fields blank."})
		}

	}

	render() {
		if (this.state.toChat === true) {
			return <Redirect to="/chat" />;
		}

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
						autoComplete="new-password"
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

export { LogIn }