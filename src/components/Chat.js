import React from "react";
import { render } from "react-dom";
import { Redirect } from "react-router-dom";
import io from "socket.io-client";

class Chat extends React.Component {
	constructor(props) {
		super(props);

		this.input = React.createRef();
		this.socket = null;

		this.state = {
			// messages: array of objects with from and msg properties
			messages: [],
			status1: "matching you with a stranger ..."
		}
	}

	componentDidMount() {
		if (this.props.authNickname) {
			this.socket = io();

			var onConnectSend = {
				nickname: this.props.authNickname
			};

			var onConnectCb = function(data) {
				console.log(data);
			};

			this.socket.on("connect", () => {
				this.socket.emit( "new client", onConnectSend, onConnectCb);
			
				this.socket.on("new message", (obj) => {
					let newMsg = {
						message: obj.message,
						from: "stranger"
					}

					this.setState(prevState => ({
					  messages: [...prevState.messages, newMsg]
					}));
				});

				this.socket.on("could not find match", () => {
					console.log("ok");
					this.setState({status1: "could not find match. please try again."});
				});
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

		this.socket.emit("new message", onSendSend, onSendCb);
	}

	render() {
		if (!this.props.authNickname) {
			return <Redirect to="/" />;
		}

		return (
			<div className="container full-height messages-container">
				<div className="messages">
					<div className="status-1">{this.state.status1}</div>
					{this.state.messages.map(msg => <span>{msg.from}: {msg.msg}</span>)}
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