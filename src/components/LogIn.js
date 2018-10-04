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

		this.handleChange = this.handleChange.bind(this);
	}

	handleChange(e) {
		if ( e.target.value.length - this.state[e.target.name].length > 1 ) {
			return;
		}

		this.setState({[e.target.name]: e.target.value})
	}

	onSubmit(e) {
		e.preventDefault();

		var { nickname, password } = this.state;

		if (nickname.length > 4 && password.length > 4) {
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
						this.props.setAuthRating(response.data.rating);
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
			this.setState({errorMsg: "nickname and password must be 5 or more characters in length."})
		}
	}

	render() {
		if (this.state.toChat === true) {
			return <Redirect to="/chat" />;
		}

		return (
			<div className="login-container text-center full-height">
				<header></header>
				<h1>lolchat</h1>
				<div className="h5">chat with decent strangers</div>
				<div>log in or <Link to={'/signup'}>sign up</Link></div>
				<form className="mt-3">
					<label htmlFor="nickname">nickname</label>
					<input
						autoComplete="nickname"
						name="nickname"
						onChange={this.handleChange}
						type="text"
						value={this.state.nickname}
					/><br />
					<label htmlFor="password">password</label>
					<input 
						autoComplete="current-password"
						name="password"
						onChange={this.handleChange}
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
						value="chat with strangers"
					/>
				</form>
			</div>
		);
	}
}

export { LogIn }