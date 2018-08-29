import React from "react";
import { render } from "react-dom";
import { Redirect } from "react-router-dom";
import io from "socket.io-client";
const socket = io();

class Chat extends React.Component {
	constructor(props) {
		super(props);

		this.input = React.createRef();
		this.messages = ['stranger: sample message'];
		this.socket = null;
	}

	componentDidMount() {
		if (this.props.authNickname) {
			

			var onConnectSend = {
				nickname: this.props.authNickname
			};

			var onConnectCb = function(data) {
				console.log(data);
			};

			socket.on("connect", function() {
				console.log(socket);
				socket.emit( "client: new client", onConnectSend, onConnectCb);
			});

		}
	}

	onSend(e) {
		e.preventDefault();

		var onSendSend = {
			message: this.input.current.value
		};

		var onSendCb = (data) => {
			console.log(data);
		};

		socket.emit("client: new message", onSendSend, onSendCb);
	}

	render() {
		if (!this.props.authNickname) {
			return <Redirect to="/" />;
		}

		return (
			<div className="container full-height messages-container">
				<div className="messages">
					<div className="status">status message...</div>
					{this.messages.map(msg => <span>{msg}</span>)}
				</div>
				<div>
					<div className="disconnect-btn__wrap">
						disconnect
					</div>
					<input type="text" ref={this.input} />

					<button 
						type="submit" 
						onClick={e => this.onSend(e)}
					>Send</button>

				</div>
			</div>
		);
	}
}

export { Chat }