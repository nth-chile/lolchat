import React from "react";
import { render } from "react-dom";
import { Redirect } from "react-router-dom";
import io from "socket.io-client";
import shortid from "shortid";

class Chat extends React.Component {
	constructor(props) {
		super(props);

		this.keysDown = {};
		this.socket = null;

		this.state = {
			showChatEndedStuff: false,
			disconnectBtn: "disconnect",
			disconnectBtnsDisabled: true,
			inputValue: "",
			matching: false,
			// messages: array of objects with from and msg properties
			messages: [],
			status1: "",
			status2: "",
			submitDisabled: true,
			// pendingVote: "up" or "down"
			pendingVote: null
		}

		this.handleDisconnectBtnClick = this.handleDisconnectBtnClick.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.handleKeyUp = this.handleKeyUp.bind(this);
		this.handleNewChatBtnClick = this.handleNewChatBtnClick.bind(this);
		this.handleSend = this.handleSend.bind(this);
	}

	componentDidMount() {
		if (this.props.authNickname) {
			this.socket = io();

			console.log(this.props.authRating);

			var onConnectSend = {
				nickname: this.props.authNickname
			};

			var onConnectCb = (data) => {
				this.setState({
					status1: "matching you with a stranger ...",
					matching: true,
					messages: [],
					status2: ""
				});
			};

			this.socket.on("connect", () => {
				this.socket.emit( "new client", onConnectSend, onConnectCb);
			});

			this.socket.on("new match", () => {
				this.setState({
					status1: "new match! say hello.",
					submitDisabled: false,
					disconnectBtnsDisabled: false,
					disconnectBtn: "disconnect",
					showChatEndedStuff: false,	
					matching: false,
					messages: []
				});
			});
		
			this.socket.on("new message", (obj) => {
				let newMsg = {
					message: obj.message,
					from: "stranger",
					id: shortid.generate()
				}

				this.setState(prevState => ({
				  messages: [...prevState.messages, newMsg]
				}));
			});

			this.socket.on("could not find match", () => {
				this.setState({
					status1: "could not find a match for you. please try again.",
					disconnectBtn: "new",
					disconnectBtnsDisabled: false,
					matching: false
				});
				
				this.socket.disconnect();
			});

			this.socket.on("your partner disconnected", () => {
				this.setState({
					status2: "this stranger just disconnected.",
					submitDisabled: true,
					disconnectBtn: "new",
					showChatEndedStuff: false
				});

				this.socket.disconnect();
			});
		}
	}

	componentWillMount() {
		document.addEventListener("keydown", this.handleKeyDown, false);
		document.addEventListener("keyup", this.handleKeyUp, false);
	}

	componentWillUnmount() {
		document.removeEventListener("keydown", this.handleKeyDown, false);
		document.removeEventListener("keyup", this.handleKeyUp, false);
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
					if (res === "success") {
						this.socket.disconnect();
						this.setState({
							disconnectBtn: "new",
							submitDisabled: true,
							status2: "you just disconnected.",
							showChatEndedStuff: false
						});
					} else {
						console.log('vote failed');
					}
				}

				this.socket.emit( "vote/disconnect", { vote }, voteCallback);
		}
	}

	handleInputChange(e) {

		if ( e.target.value.length - this.state.inputValue.length > 1 ) {
			return;
		}

		this.setState({inputValue: e.target.value});
	}

	handleKeyDown(e) {
		this.keysDown[e.key] = true;

        if (
        	this.keysDown["Enter"] && 
    		!this.keysDown["Shift"] &&
     		document.activeElement.id === "msg-write-box"
     	) {
     		console.log(this.keysDown);
        	e.preventDefault();
			this.handleSend();
        }
	}

	handleKeyUp(e) {
		console.log("keyup");
		this.keysDown[e.key] = false;
	}

	handleNewChatBtnClick(e) {
		if (!this.state.matching) {
			this.socket.disconnect();
			this.socket.open();
		}
	}

	handleSend(e) {
		e && e.preventDefault();
		const { inputValue } = this.state;

		if (inputValue) {
			let newMsg = {
				message: inputValue,
				from: "you",
				id: shortid.generate()
			};

			this.setState(prevState => ({
				messages: [...prevState.messages, newMsg],
				inputValue: "",
				disconnectBtn: "disconnect"
			}));	

			var data = {
				message: inputValue
			};

			var cb = (data) => {
				// if (data === "message sent") {
				// 	console.log("message sent");
				// }
				return;
			};

			this.socket.emit("send message", data, cb);
		}
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
								className={this.state.disconnectBtnsDisabled ? "btn--disconnect" : "btn--disconnect btn--disabled"}
								disabled={this.state.disconnectBtnsDisabled}
								onClick={() => this.handleDisconnectBtnClick("disconnect")}
								type="button"
							>disconnect</button>
							<button
								className={this.state.disconnectBtnsDisabled ? "btn--disconnect_downvote" : "btn--disconnect_downvote btn--disabled"}
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
							class={this.state.disconnectBtnsDisabled ? "btn--confirm" : "btn--confirm btn--disabled"}
							disabled={this.state.disconnectBtnsDisabled}
							onClick={() => this.handleDisconnectBtnClick("confirm")}
							type="button"
						>really?</button>
					);
					break;
				case "new":
					return (
						<button
							className={this.state.disconnectBtnsDisabled ? "btn--new-chat" : "btn--new-chat btn--disabled"}
							disabled={this.state.disconnectBtnsDisabled}
							onClick={() => this.handleNewChatBtnClick()}
							type="button"
						>new chat</button>
					);
			}
		}

		return (
			<div className="messages-container">
				<header></header>
				<div className="messages__wrap">
					<div>
						<div className="status-1">{this.state.status1}</div>
						{this.state.messages.map(msg => 
							<span key={msg.id}>
								<span className={msg.from === "you" ? "text-red" : "text-blue"}>{msg.from}:</span> {msg.message}
							</span>)}
						<div className="status-2">{this.state.status2}</div>
						{this.state.showChatEndedStuff && (
							<button
								type="button"
								onClick={this.handleNewChatBtnClick}
							>new chat</button>
						)}
					</div>
					<div className="chat-controls">
						<div className="disconnect-btn__wrap">
							{ renderDisconnectBtn() }
						</div>
						<textarea
							autoFocus 
							id="msg-write-box"
							onChange={this.handleInputChange}
							type="text" 
							value={this.state.inputValue}
						/>

						<button
							className={this.state.submitDisabled ? "btn--send btn--disabled" : "btn--send"}
							disabled={this.state.submitDisabled}
							type="submit" 
							onClick={this.handleSend}
						>send</button>
					</div>
				</div>
			</div>
		);
	}
}

export { Chat }