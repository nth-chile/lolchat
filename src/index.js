import React from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import "./style/index.scss";
require("webpack-hot-middleware/client");
import { Chat, LogIn, SignUp } from "./components"

class App extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			authNickname: null
		}
	}

	setAuthNickname(nickname) {
		this.setState({authNickname: nickname});
	}

	render() {
		return (
			<Router>
				<div className="container">
					<header></header>
					<Route 
						path="/chat" 
						render={(props) => <Chat authNickname={this.state.authNickname} />}
					/>
					<Route 
						path="/" 
						render={(props) => <LogIn setAuthNickname={this.setAuthNickname.bind(this)} />}
						exact={true} 
					/>
					<Route 
						path="/signup" 
						render={(props) => <SignUp setAuthNickname={this.setAuthNickname.bind(this)} />}
					/>
				</div>
			</Router>
		);
	}
}

render(<App />, window.document.getElementById("app"));