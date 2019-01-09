import React from "react";
import { render } from "react-dom";
import { Link, Redirect } from "react-router-dom";
import axios from "axios";

class SignUp extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			nickname: "",
			password: "",
			errorMsg: "",
			toChat: false,
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
			axios.post("/action/signup", {
				nickname,
				password
			})
			.then((response) => {
				switch (response.data.action) {
					case "NICKNAME_IN_USE":
						this.setState({errorMsg: "that nickname has already been registered."});
						break;
					case "REGISTRATION_SUCCESS":
						this.props.setAuthNickname(nickname);
						this.props.setAuthRating(response.data.rating);
						this.setState({toChat: true});
						break;
					default:
						this.setState({errorMsg: "registration failed. please try again later."});

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
			<div className="signup-container text-center">
				<header></header>
				<h1>karma chat</h1>
				<div className="h5 headline">karma chat enforces the golden rule by matching you with people who treat others as you do</div>
				<div>sign up or <Link to={'/'}>log in</Link></div>
				<form>
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
						autoComplete="new-password"
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

export { SignUp }