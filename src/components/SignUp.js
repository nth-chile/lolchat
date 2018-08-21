import React from "react";
import { render } from "react-dom";

class SignUp extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			nickname: "",
			password: ""
		}
	}

	render() {
		return (
			<div>
				<form>
					<input 
						onChange={e => this.setState({nickname: e.target.value})}
						type="text"
						value={this.state.nickname}
					/>
					<input 
						onChange={e => this.setState({password: e.target.value})}
						type="password"
						value={this.state.password}
					/>
					<input 
						type="submit" 
						className="" 
						value="chat with a stranger"
					/>
				</form>
			</div>
		);
	}
}

export default SignUp