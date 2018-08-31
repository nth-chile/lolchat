import React from "react";
import { render } from "react-dom";
import { Redirect } from "react-router-dom";
import io from "socket.io-client";

class Chat extends React.Component {
	constructor(props) {
		super(props);

		this.socket = null;

		this.state = {
			disconnectBtn: "disconnect",
			disconnectBtnsDisabled: true,
			inputValue: "",
			// messages: array of objects with from and msg properties
			messages: [],
			status1: "matching you with a stranger ...",
			status2: "",
			submitDisabled: true,
			// pendingVote: "up" or "down"
			pendingVote: null
		}

		this.handleDisconnectBtnClick = this.handleDisconnectBtnClick.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
	}

	componentDidMount() {
		if (this.props.authNickname) {
			this.socket = io();

			console.log(this.props.authRating);

			var onConnectSend = {
				nickname: this.props.authNickname
			};

			var onConnectCb = function(data) {
				console.log(data);
			};

			this.socket.on("connect", () => {
				this.socket.emit( "new client", onConnectSend, onConnectCb);

				this.socket.on("new match", () => {
					this.setState({
						status1: "new match! say hello.",
						submitDisabled: false,
						disconnectBtnsDisabled: false
					});
				});
			
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
					this.setState({status1: "could not find a match for you. please try again."});
				});

				this.socket.on("your partner disconnected", () => {
					this.setState({
						status2: "this stranger just disconnected.",
						submitDisabled: true
					});
				});
			});
		}
	}

	handleDisconnectBtnClick(btnId) {
		switch (btnId) {
			case "disconnect":;
				this.setState({
					pendingVote: "up",
					disconnectBtn: "confirm"
				});

				break;

			case "disconnect_downvote":
				this.setState({
					pendingVote: "down",
					disconnectBtn: "confirm"
				});

				break;

			case "confirm":
				let vote = this.state.pendingVote;

				let voteCallback = (res) => {
					console.log(res);
					if (res === "success") {
						this.socket.disconnect();
						this.setState({disconnectBtnsDisabled: false});
					}
				}

				this.socket.emit( "vote", { vote }, voteCallback);

				break;

			case "new":
				console.log("new chat btn clicked");
		}
	}

	handleInputChange(e) {
		this.setState({inputValue: e.target.value});
	}

	handleSend(e) {
		e.preventDefault();
		const { inputValue } = this.state;

		let newMsg = {
			message: inputValue,
			from: "you"
		};

		this.setState(prevState => ({
			messages: [...prevState.messages, newMsg],
			inputValue: ""
		}));	

		var handleSendSend = {
			message: inputValue
		};

		var handleSendCb = (data) => {
			// if (data === "message sent") {
			// 	console.log("message sent");
			// }
			return;
		};

		this.socket.emit("new message", handleSendSend, handleSendCb);
	}

	render() {
		if (!this.props.authNickname) {
			return <Redirect to="/" />;
		}

		let renderDisconnectBtn = () => {
			switch (this.state.disconnectBtn) {
				case "disconnect":
					return (
						<React.Fragment>
							<button
								disabled={this.state.disconnectBtnsDisabled}
								onClick={() => this.handleDisconnectBtnClick("disconnect")}
								type="button"
							>disconnect</button>
							<button
								disabled={this.state.disconnectBtnsDisabled}
								onClick={() => this.handleDisconnectBtnClick("disconnect_downvote")}
								type="button"
							>disconnect & downvote</button>
						</React.Fragment>
					);
					break;
				case "confirm":
					return (
						<button
							disabled={this.state.disconnectBtnsDisabled}
							onClick={() => this.handleDisconnectBtnClick("confirm")}
							type="button"
						>really?</button>
					);
					break;
				case "new":
					return (
						<button
							disabled={this.state.disconnectBtnsDisabled}
							onClick={() => this.handleDisconnectBtnClick("new")}
							type="button"
						>new chat</button>
					);
			}
		}

		return (
			<div className="container full-height messages-container">
				<div className="messages">
					<div className="status-1">{this.state.status1}</div>
					{this.state.messages.map(msg => <span>{msg.from}: {msg.message}</span>)}
					<div className="status-2">{this.state.status2}</div>
				</div>
				<div>
					<div className="disconnect-btn__wrap">
						{ renderDisconnectBtn() }
					</div>
					<input 
						onChange={this.handleInputChange}
						type="text" 
						value={this.state.inputValue}
					/>

					<button
						disabled={this.state.submitDisabled}
						type="submit" 
						onClick={this.handleSend}
					>Send</button>

				</div>
			</div>
		);
	}
}

export { Chat }