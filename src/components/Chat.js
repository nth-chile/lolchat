import React from "react";
import { render } from "react-dom";
import { Redirect } from "react-router-dom";
import io from "socket.io-client";

var socket = io();

class Chat extends React.Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		var onConnectSend = {
			nickname: this.props.authNickname
		};

		var onConnectCb = function(data) {
			console.log(data);
		};

		socket.on("connect", function(whatIsThis) {
			socket.emit( "client: new client", { ...onConnectSend, whatIsThis }, onConnectCb);
		});
	}

	onSubmit() {

	}

	render() {
		if (!this.props.authNickname) {
			return <Redirect to="/" />;
		}

		return (
			<div className="container">
				chatting ...
			</div>
		);
	}
}

export { Chat }