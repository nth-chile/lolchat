import React from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import "./style/index.scss";
const IS_DEV = process.env.NODE_ENV === "development";
import { Chat, LogIn, SignUp } from "./components"

if (IS_DEV) require("webpack-hot-middleware/client");

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			authNickname: null,
			authRating: null
		}
	}

	setAuthNickname(nickname) {
		this.setState({authNickname: nickname});
	}

	setAuthRating(rating) {
		this.setState({authRating: rating});
	}

	render() {
		return (
			<Router>
				<div>
					<Route 
						path="/chat" // /chat
						render={(props) => <Chat
							authNickname={this.state.authNickname}
							authRating={this.state.authRating} 
						/>}
					/>
					<Route 
						path="/" // /
						render={(props) => <LogIn 
							setAuthNickname={this.setAuthNickname.bind(this)} 
							setAuthRating={this.setAuthRating.bind(this)} 
						/>}
						exact={true} 
					/>
					<Route 
						path="/signup" 
						render={(props) => <SignUp 
							setAuthNickname={this.setAuthNickname.bind(this)} 
							setAuthRating={this.setAuthRating.bind(this)} 
						/>}
					/>
				</div>
			</Router>
		);
	}
}

render(<App />, window.document.getElementById("app"));