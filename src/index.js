import React from "react";
import { render } from "react-dom";

class App extends React.Component {
	render() {
		return (
			<div>
				<ul id="messages"></ul>
			    <form action="">
			      <input id="m" /><button>Send</button>
			    </form>
			</div>
		);
	}
}

render(<App />, window.document.getElementById("app"));