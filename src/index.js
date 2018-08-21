import React from "react";
import { render } from "react-dom";
import "./style/index.scss";
require("webpack-hot-middleware/client");
import { LogIn } from "./components"

class App extends React.Component {
	render() {
		return (
			<React.Fragment>
				<LogIn />
			</React.Fragment>
		);
	}
}

render(<App />, window.document.getElementById("app"));