import React from "react";
import { render } from "react-dom";
import { BrowserRouter as Router, Route } from "react-router-dom";
import "./style/index.scss";
require("webpack-hot-middleware/client");
import { LogIn, SignUp } from "./components"

class App extends React.Component {
	render() {
		return (
			<Router>
				<div className="container">
					<header></header>
					<Route exact={true} path="/" component={LogIn} />
					<Route path="/signup" component={SignUp} />
				</div>
			</Router>
		);
	}
}

render(<App />, window.document.getElementById("app"));