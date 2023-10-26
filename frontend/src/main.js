import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import {
	fileToDataUrl,
	apiCallPost,
	clearChildren,
	insertAsFirstChild,
} from './helpers.js';

let globalToken = null;
let globalUserId = null;

console.log('BACKEND_PORT', BACKEND_PORT);
function showErrorPopup(message) {	//take place of alert
	document.getElementById('errorMessage').textContent = message;
	document.getElementById('errorPopup').style.display = 'block';
}


const apiCallPost2 = (path, body, authed = false) => {
	return new Promise((callbackSuccess, callbackError) => {
		fetch(`http://localhost:5005/${path}`, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'Content-type': 'application/json',
				'Authorization': authed ? `Bearer ${globalToken}` : undefined
			}
		})
			.then((response) => response.json())
			.then((body) => {
				console.log(body);
				if (body.error) {
					callbackError(body.error);
				} else {
					callbackSuccess(body);
				}
			});
	});
}


const apiCallGet2 = (path, body, authed=false) => {
	return new Promise((resolve, reject) => {
		fetch(`http://localhost:5005/${path}`, {
			method: 'GET',
			headers: {
				'Content-type': 'application/json',
				'Authorization': authed ? `Bearer ${globalToken}` : undefined
			}
		})
		.then((response) => response.json())
		.then((body) => {
			console.log(body);
			if (body.error) {
				reject(body.error);
			} else {
				resolve(body);
			}
		});
	});
}

const apiCallPut2 = (path, body, authed = false) => {
	return new Promise((callbackSuccess, callbackError) => {
		fetch(`http://localhost:5005/${path}`, {
			method: 'PUT',
			body: JSON.stringify(body),
			headers: {
				'Content-type': 'application/json',
				'Authorization': authed ? `Bearer ${globalToken}` : undefined
			}
		})
			.then((response) => response.json())
			.then((body) => {
				console.log(body);
				if (body.error) {
					callbackError(body.error);
				} else {
					callbackSuccess(body);
				}
			});
	});
}

const apiCallDelete2 = (path, body, authed = false) => {
	return new Promise((callbackSuccess, callbackError) => {
		fetch(`http://localhost:5005/${path}`, {
			method: 'DELETE',
			body: JSON.stringify(body),
			headers: {
				'Content-type': 'application/json',
				'Authorization': authed ? `Bearer ${globalToken}` : undefined
			}
		})
			.then((response) => response.json())
			.then((body) => {
				console.log(body);
				if (body.error) {
					callbackError(body.error);
				} else {
					callbackSuccess(body);
				}
			});
	});
}



let current_channel_id = null;
let short_memo_channel_members = {};
let short_memo_channel_members_avatar = {};
let current_channel_messages_count = 0;

let current_channel_image_queue = [];
let current_channel_image_queue_index = 0;
document.getElementById('channel-image-checking-previous').addEventListener('click', (event) => { //check previous image
	event.stopPropagation();	//stop event bubbling
	if (current_channel_image_queue_index < current_channel_image_queue.length - 1) {
		current_channel_image_queue_index += 1;
		document.getElementById('channel-image-checking-current').src = document.getElementById(current_channel_image_queue[current_channel_image_queue_index]).src;
	}
	else {
        current_channel_image_queue_index = 0;
        document.getElementById('channel-image-checking-current').src = document.getElementById(current_channel_image_queue[current_channel_image_queue_index]).src;
    }
});
document.getElementById('channel-image-checking-next').addEventListener('click', (event) => { //check next image
	event.stopPropagation();	//stop event bubbling
	if (current_channel_image_queue_index > 0) {
		current_channel_image_queue_index -= 1;
		document.getElementById('channel-image-checking-current').src = document.getElementById(current_channel_image_queue[current_channel_image_queue_index]).src;
	}
	else {
		current_channel_image_queue_index = current_channel_image_queue.length - 1;
		document.getElementById('channel-image-checking-current').src = document.getElementById(current_channel_image_queue[current_channel_image_queue_index]).src;
	}
});



document.getElementById('channel-chatroom').addEventListener('scroll', () => {

	const chatroom_scroll = document.getElementById('channel-chatroom');
	if ((current_channel_id !== -1) && (chatroom_scroll.scrollTop <= 1) && (chatroom_scroll.scrollHeight > chatroom_scroll.clientHeight)) { // 1px from the top
		loadMoreMessages();
	}
});

const loadMoreMessages = () => {
	const message_list = document.getElementById('channel-chatroom');
	const loader = document.createElement("div");
	const loader_text = document.createElement("p");
	loader.setAttribute("class", "hidden");
	loader.setAttribute("id", "loader");
	loader_text.innerText = "Loading...";
	loader_text.setAttribute("style", "text-align: center; margin-top: 10px;");
    loader.appendChild(loader_text);

	const old_scroll_height = document.getElementById('channel-chatroom').scrollHeight;
	// Display the loader
	insertAsFirstChild(message_list, loader);
	loader.style.display = 'block';


	apiCallGet2(`message/${current_channel_id}?start=${current_channel_messages_count}`, {}, true) //load more messages
		.then(body => {
			console.log(body);
			loader.style.display = 'none';

			document.getElementById('message-input-bar').style.display = 'block';
			const message_list = document.getElementById("channel-chatroom");
			body.messages.forEach(message => {
				current_channel_messages_count += 1;
				const current_message = document.createElement("div");
				current_message.setAttribute("class", "message");
				const current_message_content = document.createElement("div");
				current_message_content.setAttribute("class", "message-content");
				const current_message_content_time = document.createElement("p");
				current_message_content_time.setAttribute("class", "message-time");
				const date = new Date(message.sentAt);
				current_message_content_time.innerText = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
				current_message_content_time.setAttribute("style", "margin-left: 20px;");
				const message_content_sender = document.createElement("div");
				message_content_sender.setAttribute("class", "message-sender");
				message_content_sender.setAttribute("style", "display: flex; flex-direction: row; font-weight: bold;")
				const message_content_sender_name = document.createElement("h7");
				message_content_sender_name.setAttribute("class", "message-sender_name");
				message_content_sender_name.innerText = message.sender;

				message_content_sender_name.addEventListener('click', () => { //check sender info
					apiCallGet2(`user/${message.sender}`, {}, true)
						.then(body => {
							console.log(body);
							document.getElementById('sender-info-popup').style.display = 'block';
							document.getElementById('sender-info-avatar').setAttribute("src", body.image);
							document.getElementById('sender-info-name').innerText = body.name;
							document.getElementById('sender-info-email').innerText = body.email;
							document.getElementById('sender-info-description').innerText = body.bio;
						})
						.catch((msg) => {
							showErrorPopup(msg);
						});
				});

				const message_pin_btn = document.createElement("button"); // pin message button
				message_pin_btn.setAttribute("class", "message-pin-button");
				message_pin_btn.innerText = "📌";
				current_message_content.appendChild(message_pin(message.id, message.pinned, message_pin_btn));

				const message_react_container_bar = document.createElement("div");		//message react bar
				message_react_container_bar.setAttribute("class", "message-react-container-bar");
				message_react_container_bar.setAttribute("style", "display: flex; flex-direction: row; margin-left: 20px; margin-top: 10px; margin-bottom: 10px; align-items: center; justify-content: flex-end;");
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "thumbs_up", "👍"));
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "thumbs_down", "👎"));
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "laugh", "😂"));
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "heart", "❤️"));
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "rocket", "🚀"));

				if (message.edited) { //check if message is edited
					const edited_date = new Date(message.editedAt);
					current_message_content_time.innerText += ` (edited at ${edited_date.toLocaleDateString()} ${edited_date.toLocaleTimeString()})`;
				}

				if (message.sender === globalUserId) {
					current_message_content.setAttribute("style", "background-color: #e6e6e6; border-radius: 10px; padding: 10px; margin-left: 20px; margin-right: 20px; margin-top: 10px; margin-bottom: 10px; color: green;");

					const message_edit_button = document.createElement("button"); // edit message button
					message_edit_button.setAttribute("class", "message-edit-button");
					message_edit_button.innerText = "Edit";
					message_edit_button.addEventListener('click', () => {
						document.getElementById('message-editing').style.display = 'block';
						document.getElementById('edited-message').value = message.message;
						document.getElementById('editing-message-id').innerText = message.id;
						document.getElementById('editing-message-old').innerText = message.message;
					});

					const message_delete_button = document.createElement("button");  //delete message button
					message_delete_button.setAttribute("class", "message-delete-button");
					message_delete_button.setAttribute("id", `DM${message.id}`);
					message_delete_button.innerText = "Delete";
					message_delete_button.addEventListener('click', () => {
						apiCallDelete2(`message/${current_channel_id}/${message.id}`, {}, true)
							.then(() => {
								loadMessages();
							})
							.catch((msg) => {
								showErrorPopup(msg);
							});
					});
					current_message_content.appendChild(message_edit_button);
					current_message_content.appendChild(message_delete_button);
				}

				if (message.sender in short_memo_channel_members) {  //Change sender id to name
					message_content_sender_name.innerText = short_memo_channel_members[message.sender];
				}
				else {
					apiCallGet2(`user/${message.sender}`, {}, true)
						.then(body => {
							console.log(body);
							short_memo_channel_members[parseInt(message.sender)] = `${body.name} (${message.sender})`
							message_content_sender_name.innerText = short_memo_channel_members[message.sender];
						})
						.catch((msg) => {
							showErrorPopup(msg);
						});
				}

				const message_content_sender_avatar = document.createElement("img");
				message_content_sender_avatar.setAttribute("class", "message-user-avatar");
				message_content_sender_avatar.setAttribute("src", "./assets/default_avatar.jpg");
				message_content_sender_avatar.setAttribute("style", "width: 30px; height: 30px; border-radius: 50%;");

				if (short_memo_channel_members_avatar[message.sender]) {
					message_content_sender_avatar.setAttribute("src", short_memo_channel_members_avatar[message.sender]);
				};
				current_message_content.appendChild(message_content_sender);
				message_content_sender.appendChild(message_content_sender_avatar);
				message_content_sender.appendChild(message_content_sender_name);
				message_content_sender.appendChild(current_message_content_time);
				if (message.message) {
					const current_message_content_text = document.createElement("p");
					current_message_content_text.setAttribute("class", "message-text");
					current_message_content_text.innerText = message.message;
					current_message_content.appendChild(current_message_content_text);
				}
				if (message.image) {
					const current_message_content_image = document.createElement("img");
					current_message_content_image.setAttribute("class", "message-image");
					current_message_content_image.setAttribute("src", message.image);
					current_message_content_image.setAttribute("id", `image${message.id}`);
					current_channel_image_queue.push(`image${message.id}`);
					const current_message_content_image_index = current_channel_image_queue.length - 1;
					current_message_content_image.addEventListener('click', () => { //check image popup
						document.getElementById('channel-image-checking').style.display = 'block';
						current_channel_image_queue_index = current_message_content_image_index;
						document.getElementById('channel-image-checking-current').src = document.getElementById(current_channel_image_queue[current_channel_image_queue_index]).src;
					});
					current_message_content.appendChild(current_message_content_image);
				}
				current_message_content.appendChild(message_react_container_bar);
				current_message.appendChild(current_message_content);
				insertAsFirstChild(message_list, current_message);
			});
		})
		.then(() => {
			document.getElementById('channel-chatroom').scrollTop = document.getElementById('channel-chatroom').scrollHeight - old_scroll_height; // because of async, we need to scroll after loading messages
        })
		.catch((msg) => {
			showErrorPopup(msg);
		});

}

const message_reaction = (message_id, message_reacts, reaction, emoji) => {
	const message_react_container = document.createElement("div");
	message_react_container.setAttribute("class", "message-react-container");
	const message_react_btn = document.createElement("button");
	message_react_btn.setAttribute("class", "message-react-btn");
	message_react_btn.innerText = `${emoji}`;
	let message_react_count = document.createElement("p");
	message_react_count.setAttribute("class", "message-react-count");
	message_react_count.innerText = message_reacts.filter(react => react.react === reaction).length;
	message_react_container.appendChild(message_react_btn);
	message_react_container.appendChild(message_react_count);

	let isUserReacted = false;
	if (message_reacts.some(reactObj => reactObj.react === reaction && reactObj.user === globalUserId)) {    //check if user has reacted
		isUserReacted = true;
		message_react_btn.setAttribute("style", "background-color: blue;");
	}
    
	else {
		isUserReacted = false;
	}
	message_react_btn.addEventListener('click', () => {
		if (isUserReacted) {	//unreact
			apiCallPost2(`message/unreact/${current_channel_id}/${message_id}`, {
				"react": reaction,
				"user": globalUserId
			}, true)
				.then(() => {
					message_react_btn.setAttribute("style", "background-color: white;");
					message_react_count.innerText = parseInt(message_react_count.innerText) - 1;
					isUserReacted = false;
				})
				.catch((msg) => {
					showErrorPopup(msg);
				});
		}
		else {	//react
			apiCallPost2(`message/react/${current_channel_id}/${message_id}`, {
				"react": reaction,
				"user": globalUserId
			}, true)
				.then(() => {
					message_react_btn.setAttribute("style", "background-color: blue;");
					message_react_count.innerText = parseInt(message_react_count.innerText) + 1;
					isUserReacted = true;
				})
				.catch((msg) => {
					showErrorPopup(msg);
				});
		}
	});
	return message_react_container;
}

const message_pin = (message_id, pre_status, pin_btn) => { //pin message
	let current_status = pre_status;
	if (current_status === true) {
		pin_btn.setAttribute("style", "background-color: blue;");
	}
	else {
		pin_btn.setAttribute("style", "background-color: white;");
    }
	pin_btn.addEventListener('click', () => {
		if (current_status === false) {
			apiCallPost2(`message/pin/${current_channel_id}/${message_id}`, {}, true)
				.then(() => {
					pin_btn.setAttribute("style", "background-color: blue;");
					current_status = true;
				})
				.catch((msg) => {
					showErrorPopup(msg);
				});
		}
		else {
			apiCallPost2(`message/unpin/${current_channel_id}/${message_id}`, {}, true)
				.then(() => {
					pin_btn.setAttribute("style", "background-color: white;");
					current_status = false;
				})
				.catch((msg) => {
					showErrorPopup(msg);
				});
		}
	});
	return pin_btn;
}




const loadMessages = () => {
	return apiCallGet2(`message/${current_channel_id}?start=0`, {}, true) //load messages
		.then(body => {
			console.log(body);
			document.getElementById('message-input-bar').style.display = 'block';
			const message_list = document.getElementById("channel-chatroom");
			clearChildren(message_list);
			current_channel_messages_count = 0;
			current_channel_image_queue = [];
			current_channel_image_queue_index = 0;
			body.messages.forEach(message => {
				current_channel_messages_count += 1;
				const current_message = document.createElement("div");
				current_message.setAttribute("class", "message");
				const current_message_content = document.createElement("div");
				current_message_content.setAttribute("class", "message-content");
				const current_message_content_time = document.createElement("p");
				current_message_content_time.setAttribute("class", "message-time");
				const date = new Date(message.sentAt);
				current_message_content_time.innerText = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
				current_message_content_time.setAttribute("style", "margin-left: 20px;");
				const message_content_sender = document.createElement("div");
				message_content_sender.setAttribute("class", "message-sender");
				message_content_sender.setAttribute("style", "display: flex; flex-direction: row; font-weight: bold;")
				const message_content_sender_name = document.createElement("h7");
				message_content_sender_name.setAttribute("class", "message-sender_name");
				message_content_sender_name.innerText = message.sender;

				message_content_sender_name.addEventListener('click', () => { //check sender info
					apiCallGet2(`user/${message.sender}`, {}, true)
						.then(body => {
							console.log(body);
							document.getElementById('sender-info-popup').style.display = 'block';
							document.getElementById('sender-info-avatar').setAttribute("src", body.image);
							document.getElementById('sender-info-name').innerText = body.name;
							document.getElementById('sender-info-email').innerText = body.email;
							document.getElementById('sender-info-description').innerText = body.bio;
						})
						.catch((msg) => {
							showErrorPopup(msg);
						});
				});

				const message_pin_btn = document.createElement("button"); // pin message button
				message_pin_btn.setAttribute("class", "message-pin-button");
				message_pin_btn.innerText = "📌";
				current_message_content.appendChild(message_pin(message.id, message.pinned, message_pin_btn));


				const message_react_container_bar = document.createElement("div");		//message react bar
				message_react_container_bar.setAttribute("class", "message-react-container-bar");
				message_react_container_bar.setAttribute("style", "display: flex; flex-direction: row; margin-left: 20px; margin-top: 10px; margin-bottom: 10px; align-items: center; justify-content: flex-end;");
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "thumbs_up", "👍"));
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "thumbs_down", "👎"));
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "laugh", "😂"));
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "heart", "❤️"));
				message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "rocket", "🚀"));


				if (message.edited) { //check if message is edited
					const edited_date = new Date(message.editedAt);
					current_message_content_time.innerText += ` (edited at ${edited_date.toLocaleDateString()} ${edited_date.toLocaleTimeString()})`;
                }
				

				if (message.sender === globalUserId) {
					current_message_content.style.color = "green";

					const message_edit_button = document.createElement("button"); // edit message button
					message_edit_button.setAttribute("class", "message-edit-button");
					message_edit_button.innerText = "Edit";
					message_edit_button.addEventListener('click', () => {
						document.getElementById('message-editing').style.display = 'block';
						document.getElementById('edited-message').value = message.message;
						document.getElementById('editing-message-id').innerText = message.id;
						document.getElementById('editing-message-old').innerText = message.message;
					});
					const message_delete_button = document.createElement("button");  //delete message button
					message_delete_button.setAttribute("class", "message-delete-button");
					message_delete_button.setAttribute("id", `DM${message.id}`);
					message_delete_button.innerText = "Delete";
					message_delete_button.addEventListener('click', () => {
						apiCallDelete2(`message/${current_channel_id}/${message.id}`, {}, true)
							.then(() => {
								loadMessages();
							})
							.catch((msg) => {
								showErrorPopup(msg);
							});
					});
					current_message_content.appendChild(message_edit_button);
					current_message_content.appendChild(message_delete_button);
				}

				if (message.sender in short_memo_channel_members) {  //Change sender id to name
					message_content_sender_name.innerText = short_memo_channel_members[message.sender];
				}
				else {
					apiCallGet2(`user/${message.sender}`, {}, true)
						.then(body => {
							console.log(body);
							short_memo_channel_members[parseInt(message.sender)] = `${body.name} (${message.sender})`
							message_content_sender_name.innerText = short_memo_channel_members[message.sender];
						})
						.catch((msg) => {
							showErrorPopup(msg);
						});
                }


				const message_content_sender_avatar = document.createElement("img");
				message_content_sender_avatar.setAttribute("class", "message-user-avatar");
				message_content_sender_avatar.setAttribute("src", "./assets/default_avatar.jpg");
				message_content_sender_avatar.setAttribute("style", "width: 30px; height: 30px; border-radius: 50%;");

				if (short_memo_channel_members_avatar[message.sender]) {
					message_content_sender_avatar.setAttribute("src", short_memo_channel_members_avatar[message.sender]);
				};
				current_message_content.appendChild(message_content_sender);
				message_content_sender.appendChild(message_content_sender_avatar);
				message_content_sender.appendChild(message_content_sender_name);
				message_content_sender.appendChild(current_message_content_time);
				if (message.message) {
					const current_message_content_text = document.createElement("p");
					current_message_content_text.setAttribute("class", "message-text");
					current_message_content_text.innerText = message.message;
					current_message_content.appendChild(current_message_content_text);
				}
				if (message.image) {
					const current_message_content_image = document.createElement("img");
					current_message_content_image.setAttribute("class", "message-image");
					current_message_content_image.setAttribute("src", message.image);
					current_message_content_image.setAttribute("id", `image${message.id}`);
					current_message_content_image.setAttribute("id", `image${message.id}`);
					current_channel_image_queue.push(`image${message.id}`);
					const current_message_content_image_index = current_channel_image_queue.length - 1;
					current_message_content_image.addEventListener('click', () => { //check image popup
						document.getElementById('channel-image-checking').style.display = 'block';
						current_channel_image_queue_index = current_message_content_image_index;
						document.getElementById('channel-image-checking-current').src = document.getElementById(current_channel_image_queue[current_channel_image_queue_index]).src;
					});
					current_message_content.appendChild(current_message_content_image);
				}
				current_message_content.appendChild(message_react_container_bar);
				current_message.appendChild(current_message_content);
				insertAsFirstChild(message_list, current_message);
			});
			document.getElementById('channel-chatroom').scrollTop = document.getElementById('channel-chatroom').scrollHeight;
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
}

document.getElementById('close-sender-info-PopupBtn').addEventListener('click', () => { //close sender info popup
	document.getElementById('sender-info-popup').style.display = 'none';
});

let channels_last_messaage_time_dict = {};
let intervalID = null;	//store interval id

const startPolling = () => {			//check if there is new message, font color will change to red
	intervalID = setInterval(() => {			// check every 1 second
		const all_channel_list = document.getElementById('all-channels-list');
		const channels = all_channel_list.querySelectorAll('[data-channel-id]');

		channels.forEach((channel) => {
			const if_user_in_channel = channel.getAttribute('data-if-in-channel');
			if (if_user_in_channel === '1') {
				const channel_id = channel.getAttribute('data-channel-id');
				apiCallGet2(`message/${channel_id}?start=0`, {}, true)
					.then(body => {
						if (body.messages.length > 0 && body.messages[0].sender !== parseInt(globalUserId)) {
							const date = new Date(body.messages[0].sentAt);
							if (channel_id in channels_last_messaage_time_dict) {
								if (date > channels_last_messaage_time_dict[channel_id]) {
									channels_last_messaage_time_dict[channel_id] = date;
									channel.style.color = "#E57373";
								}
							}
							else {
								channels_last_messaage_time_dict[channel_id] = date;
							}
						}
					})
					.catch((msg) => {
						showErrorPopup(msg);
					});
			}
		});

	}, 1000);  // 1 second
}
function stopPolling() {
	clearInterval(intervalID);
}

const loadDashboard = () => {		//load dashboard
	// hard reset channel list 
	const public_channel_list = document.getElementById("public-channels-list");
	const private_channel_list = document.getElementById("private-channels-list");
	clearChildren(public_channel_list);
	clearChildren(private_channel_list);
	apiCallGet2('channel', {}, true)
		.then(body => {
			console.log('globalUserId', globalUserId);
			console.log('channels', body);
			body.channels.forEach(channel => {	//load channels
				const current_channel = document.createElement("button");
				current_channel.setAttribute("id", "channel_" + channel.id);
				current_channel.setAttribute("type", "button");
				current_channel.setAttribute("data-channel-id", channel.id);
				current_channel.style.color = "black";
				current_channel.innerText = channel.name;

				if (channel.private) {
					if (channel.members.includes(globalUserId)) {
						current_channel.setAttribute("class", "private-channel list-group-item list-group-item-action");
						private_channel_list.appendChild(current_channel);
						current_channel.setAttribute("data-if-in-channel", 1);
					} 
				}
				else {
					current_channel.setAttribute("class", "public-channel list-group-item list-group-item-action");
					public_channel_list.appendChild(current_channel);
					if (channel.members.includes(globalUserId)) {
						current_channel.setAttribute("data-if-in-channel", 1);
					}
					else {
						current_channel.setAttribute("data-if-in-channel", 0);
					}
					
				}
				current_channel.addEventListener('click', () => { //check if user is in the channel
					document.getElementById('channel-screen').style.display = 'block';
					document.getElementById('btn-channel-info').style.display = 'block';
					document.getElementById('btn-channel-info-invite').style.display = 'block';
					document.getElementById('channel-title-bar-name').textContent = channel.name;
					current_channel.style.color = "black";
					current_channel_id = channel.id;
					if (channel.members.includes(globalUserId)) {  // load messages if user is in the channel
						document.getElementById('btn-channel-info-leave').style.display = 'block';
						document.getElementById('btn-channel-info-join').style.display = 'none';

						for (const member of channel.members) {		//load members
							apiCallGet2(`user/${member}`, {}, true)
								.then(member_body => {
									console.log(member_body);
									short_memo_channel_members[parseInt(member)] = `${member_body.name} (${member})`
									short_memo_channel_members_avatar[parseInt(member)] = member_body.image;
									console.log(short_memo_channel_members);
								});
						}

						loadMessages()
					}
					else {
						document.getElementById('btn-channel-info-join').style.display = 'block';
						document.getElementById('btn-channel-info-leave').style.display = 'none';
						document.getElementById('message-input-bar').style.display = 'none';
						clearChildren(document.getElementById("channel-chatroom"));
						document.getElementById('channel-chatroom').innerText = "You are not in this channel";
					}


				});

			});

		});
};

//we can delete "if (message.pinned)" to get all messages in channel
const pinned_messages_in_channel = (channel_id, loop_count, messages_index, pre_messages_count) => {	//get pinned messages in channel
	if ((loop_count === 0) || (pre_messages_count >= 25)) {
		apiCallGet2(`message/${channel_id}?start=${messages_index}`, {}, true)
			.then(body_messages => {
				loop_count += 1;
				messages_index += body_messages.messages.length;
				pre_messages_count = body_messages.messages.length;
				console.log(body_messages.messages.length);
				body_messages.messages.forEach(message => {
					if (message.pinned) {  //check if message is pinned.
						const message_list = document.getElementById("channel-chatroom");
						const channel_from = document.createElement("div");
						channel_from.setAttribute("class", "channel-from");
						channel_from.innerText = ` From channel #${channel_id}`;
						const current_message = document.createElement("div");
						current_message.setAttribute("class", "message");
						const current_message_content = document.createElement("div");
						current_message_content.setAttribute("class", "message-content");
						const current_message_content_time = document.createElement("p");
						current_message_content_time.setAttribute("class", "message-time");
						const date = new Date(message.sentAt);
						current_message_content_time.innerText = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
						current_message_content_time.setAttribute("style", "margin-left: 20px;");
						const message_content_sender = document.createElement("div");
						message_content_sender.setAttribute("class", "message-sender");
						message_content_sender.setAttribute("style", "display: flex; flex-direction: row; font-weight: bold;")
						const message_content_sender_name = document.createElement("h7");
						message_content_sender_name.setAttribute("class", "message-sender_name");
						message_content_sender_name.innerText = message.sender;

						message_content_sender_name.addEventListener('click', () => { //check sender info
							apiCallGet2(`user/${message.sender}`, {}, true)
								.then(body => {
									console.log(body);
									document.getElementById('sender-info-popup').style.display = 'block';
									document.getElementById('sender-info-avatar').setAttribute("src", body.image);
									document.getElementById('sender-info-name').innerText = body.name;
									document.getElementById('sender-info-email').innerText = body.email;
									document.getElementById('sender-info-description').innerText = body.bio;
								})
								.catch((msg) => {
									showErrorPopup(msg);
								});
						});

						const message_pin_btn = document.createElement("button"); // pin message button
						message_pin_btn.setAttribute("class", "message-pin-button");
						message_pin_btn.innerText = "📌";
						current_message_content.appendChild(message_pin(message.id, message.pinned, message_pin_btn));

						const message_react_container_bar = document.createElement("div");		//message react bar
						message_react_container_bar.setAttribute("class", "message-react-container-bar");
						message_react_container_bar.setAttribute("style", "display: flex; flex-direction: row; margin-left: 20px; margin-top: 10px; margin-bottom: 10px; align-items: center; justify-content: flex-end;");
						message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "thumbs_up", "👍"));
						message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "thumbs_down", "👎"));
						message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "laugh", "😂"));
						message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "heart", "❤️"));
						message_react_container_bar.appendChild(message_reaction(message.id, message.reacts, "rocket", "🚀"));

						if (message.edited) { //check if message is edited
							const edited_date = new Date(message.editedAt);
							current_message_content_time.innerText += ` (edited at ${edited_date.toLocaleDateString()} ${edited_date.toLocaleTimeString()})`;
						}

						if (message.sender === globalUserId) {
							current_message_content.setAttribute("style", "background-color: #e6e6e6; border-radius: 10px; padding: 10px; margin-left: 20px; margin-right: 20px; margin-top: 10px; margin-bottom: 10px; color: green;");

							const message_edit_button = document.createElement("button"); // edit message button
							message_edit_button.setAttribute("class", "message-edit-button");
							message_edit_button.innerText = "Edit";
							message_edit_button.addEventListener('click', () => {
								document.getElementById('message-editing').style.display = 'block';
								document.getElementById('edited-message').value = message.message;
								document.getElementById('editing-message-id').innerText = message.id;
								document.getElementById('editing-message-old').innerText = message.message;
							});
							const message_delete_button = document.createElement("button");  //delete message button
							message_delete_button.setAttribute("class", "message-delete-button");
							message_delete_button.setAttribute("id", `DM${message.id}`);
							message_delete_button.innerText = "Delete";
							message_delete_button.addEventListener('click', () => {
								apiCallDelete2(`message/${current_channel_id}/${message.id}`, {}, true)
									.then(() => {
										loadMessages();
									})
									.catch((msg) => {
										showErrorPopup(msg);
									});
							});
							current_message_content.appendChild(message_edit_button);
							current_message_content.appendChild(message_delete_button);
						}

						if (message.sender in short_memo_channel_members) {  //Change sender id to name
							message_content_sender_name.innerText = short_memo_channel_members[message.sender];
						}
						else {
							apiCallGet2(`user/${message.sender}`, {}, true)
								.then(body => {
									console.log(body);
									short_memo_channel_members[parseInt(message.sender)] = `${body.name} (${message.sender})`
									message_content_sender_name.innerText = short_memo_channel_members[message.sender];
								})
								.catch((msg) => {
									showErrorPopup(msg);
								});
						}

						const message_content_sender_avatar = document.createElement("img");
						message_content_sender_avatar.setAttribute("class", "message-user-avatar");
						message_content_sender_avatar.setAttribute("src", "./assets/default_avatar.jpg");
						message_content_sender_avatar.setAttribute("style", "width: 30px; height: 30px; border-radius: 50%;");

						if (short_memo_channel_members_avatar[message.sender]) {
							message_content_sender_avatar.setAttribute("src", short_memo_channel_members_avatar[message.sender]);
						};
						current_message_content.appendChild(channel_from);
						current_message_content.appendChild(message_content_sender);
						message_content_sender.appendChild(message_content_sender_avatar);
						message_content_sender.appendChild(message_content_sender_name);
						message_content_sender.appendChild(current_message_content_time);
						if (message.message) {
							const current_message_content_text = document.createElement("p");
							current_message_content_text.setAttribute("class", "message-text");
							current_message_content_text.innerText = message.message;
							current_message_content.appendChild(current_message_content_text);
						}
						if (message.image) {
							const current_message_content_image = document.createElement("img");
							current_message_content_image.setAttribute("class", "message-image");
							current_message_content_image.setAttribute("src", message.image);
							current_message_content_image.setAttribute("id", `image${message.id}`);
							current_channel_image_queue.push(`image${message.id}`);
							const current_message_content_image_index = current_channel_image_queue.length - 1;
							current_message_content_image.addEventListener('click', () => { //check image popup
								document.getElementById('channel-image-checking').style.display = 'block';
								current_channel_image_queue_index = current_message_content_image_index;
								document.getElementById('channel-image-checking-current').src = document.getElementById(current_channel_image_queue[current_channel_image_queue_index]).src;
							});
							current_message_content.appendChild(current_message_content_image);
						}
						current_message_content.appendChild(message_react_container_bar);
						current_message.appendChild(current_message_content);
						insertAsFirstChild(message_list, current_message);
					}

				});
				pinned_messages_in_channel(channel_id, loop_count, messages_index, pre_messages_count);
			})
			.catch((msg) => {
				showErrorPopup(msg);
			});
	}
}

document.getElementById('pinned_messages_collection_btn').addEventListener('click', () => {			//load pinned messages
	current_channel_id = -1;
	current_channel_image_queue = [];
	current_channel_image_queue_index = 0;
	document.getElementById('channel-screen').style.display = 'block';
	document.getElementById('channel-title-bar-name').textContent = "Pinned Message";
	document.getElementById('btn-channel-info-leave').style.display = 'none';
	document.getElementById('btn-channel-info-join').style.display = 'none';
	document.getElementById('btn-channel-info').style.display = 'none';
	document.getElementById('btn-channel-info-invite').style.display = 'none';
	document.getElementById('message-input-bar').style.display = 'none';
	clearChildren(document.getElementById("channel-chatroom"));
	apiCallGet2('channel', {}, true)
		.then(body => {
			body.channels.forEach(channel => {
				if (channel.members.includes(globalUserId)) {
					pinned_messages_in_channel(channel.id, 0, 0, 0);
				};
			});
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
});


document.getElementById('channel-image-checking').addEventListener('click', () => {	//close image checking popup
	document.getElementById('channel-image-checking').style.display = 'none';
});

document.getElementById('user-info-btn').addEventListener('click', () => {	//close channel-info popup
	document.getElementById('user-info-popup').style.display = 'block';

	document.getElementById('user-info-id').textContent = globalUserId;

	if (globalUserAvatar) {
		document.getElementById('user-info-avatar').src = globalUserAvatar;
	}
	document.getElementById('user-info-name').textContent = globalUserName;
	document.getElementById('user-info-email').textContent = globalUserEmail
	document.getElementById('user-info-description').textContent = globalUserDescription;

	document.getElementById('user-info-new-avatar').value = "";
	document.getElementById('user-info-new-name').value = "";
	document.getElementById('user-info-new-email').value = "";
	document.getElementById('user-info-new-description').value = "";
});

document.getElementById('close-user-info-PopupBtn').addEventListener('click', () => {	//close channel-info popup
	document.getElementById('user-info-popup').style.display = 'none';
});


document.getElementById('editing-message-submit').addEventListener('click', () => { //edit message
	const message_id = document.getElementById('editing-message-id').innerText;
	const new_message = document.getElementById('edited-message').value;
	const old_message = document.getElementById('editing-message-old').innerText;
	if (new_message.trim() === "") { // check if message is empty or only contains spaces
		showErrorPopup("Message cannot be empty");
		return;
	}
	else if (new_message === old_message) {
		showErrorPopup("Message cannot be the same");
		return;
	}
	else {
		apiCallPut2(`message/${current_channel_id}/${message_id}`, { 
			message: new_message,
		}, true)
			.then(() => {
				document.getElementById('message-editing').style.display = 'none';
				loadMessages();
			})
			.catch((msg) => {
				showErrorPopup(msg);
			});
	}
});

document.getElementById('editing-image-message-submit').addEventListener('click', () => {	//edit image message
	const message_id = document.getElementById('editing-message-id').innerText;
	const inputFile = document.getElementById('edited-image-message');
	const upload_image = inputFile.files[0];
	if (!upload_image) {
		showErrorPopup("Please select an image to upload.");
		return;
	}
	const reader = new FileReader();
	reader.onload = () => {	// activate when file is loaded(readAsDataURL). which is async
		const image_message = reader.result;
		apiCallPut2(`message/${current_channel_id}/${message_id}`, {
			image: image_message
		}, true)
			.then(() => {
				document.getElementById('edited-image-message').value = "";
				loadMessages();
			})
			.catch((msg) => {
				showErrorPopup(msg);
			});
	};
	reader.readAsDataURL(upload_image); // convert to base64 string
});

document.getElementById('close-editing-message-PopupBtn').addEventListener('click', () => {	//close message editing popup
	document.getElementById('message-editing').style.display = 'none';
});

document.getElementById('editing-user-avator-submit').addEventListener('click', () => { //edit user avatar

	const inputFile = document.getElementById('user-info-new-avatar');
	const upload_avatar = inputFile.files[0];

	if (!upload_avatar) {
		showErrorPopup("Please select an image to upload.");
		return;
	}

	const reader = new FileReader();

	reader.onload = () => {	// activate when file is loaded(readAsDataURL). which is async
		const new_avatar = reader.result;

		apiCallPut2(`user`, {
			image: new_avatar
		}, true)
			.then(() => {
				document.getElementById('user-info-popup').style.display = 'none';
				globalUserAvatar = new_avatar;
				loadDashboard();
			})
			.catch((msg) => {
				showErrorPopup(msg);
			});
	};

	reader.readAsDataURL(upload_avatar); // convert to base64 string
});


document.getElementById('editing-user-password-submit').addEventListener('click', () => {	//edit user password
	const new_password = document.getElementById('user-info-new-password').value;
	apiCallPut2(`user`, {
		password: new_password,
	}, true)
		.then(() => {
			document.getElementById('user-info-popup').style.display = 'none';
			loadDashboard();
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});

});

document.getElementById('editing-user-name-submit').addEventListener('click', () => {	//edit user name
	const new_name = document.getElementById('user-info-new-name').value;
	apiCallPut2(`user`, {
		name: new_name,
	}, true)
		.then(() => {
			document.getElementById('user-info-popup').style.display = 'none';
			globalUserName = new_name;
			loadDashboard();
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
});

document.getElementById('editing-user-email-submit').addEventListener('click', () => {	//edit user email
	const new_email = document.getElementById('user-info-new-email').value;
	apiCallPut2(`user`, {
		email: new_email,
	}, true)
		.then(() => {
			document.getElementById('user-info-popup').style.display = 'none';
			globalUserEmail = new_email;
			loadDashboard();
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
});

document.getElementById('editing-user-description-submit').addEventListener('click', () => {	//edit user description
	const new_description = document.getElementById('user-info-new-description').value;
	apiCallPut2(`user`, {
		bio: new_description,
	}, true)
		.then(() => {
			document.getElementById('user-info-popup').style.display = 'none';
			globalUserDescription = new_description;
			loadDashboard();
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
});

document.getElementById('editing-user-show-password-btn').addEventListener('click', () => {	//show user password
	if (document.getElementById('user-info-new-password').type === "password") {
		document.getElementById('user-info-new-password').type = "text";
		document.getElementById('editing-user-show-password-btn').innerText = "Hide Password";
	}
	else {
		document.getElementById('user-info-new-password').type = "password";
		document.getElementById('editing-user-show-password-btn').innerText = "Show Password";
	}
});




document.getElementById('btn-send-message').addEventListener('click', () => {	//send message
	const message = document.getElementById('message-input').value;
	if (message.trim() === "") { // check if message is empty or only contains spaces
		showErrorPopup("Message cannot be empty");
        return;
	}
	apiCallPost2(`message/${current_channel_id}`, { 
		message: message,
	}, true)
		.then(() => {
			document.getElementById('message-input').value = "";
			loadMessages();
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
});

document.getElementById('btn-send-image').addEventListener('click', () => {	//send image
	const inputFile = document.getElementById('message-input-image');
	const upload_image = inputFile.files[0];
	if (!upload_image) {
        showErrorPopup("Please select an image to upload.");
        return;
	}
	const reader = new FileReader();
	reader.onload = () => {	// activate when file is loaded(readAsDataURL). which is async
		const image_message = reader.result;
		apiCallPost2(`message/${current_channel_id}`, {
			image: image_message
		}, true)
			.then(() => {
				document.getElementById('message-input-image').value = "";
				loadMessages();
			})
			.catch((msg) => {
				showErrorPopup(msg);
			});
	};
	reader.readAsDataURL(upload_image); // convert to base64 string
});



document.getElementById('btn-channel-info-edit').addEventListener('click', () => {	//edit channel info
	document.getElementById('new-channel-name').value = "";
	document.getElementById('new-channel-description').value = "Too lazy to describe.";
	document.getElementById('channel-editing').style.display = 'block';
});

document.getElementById('close-editing-channel-PopupBtn').addEventListener('click', () => { //close channel-editing popup
	document.getElementById('channel-editing').style.display = 'none';
});

document.getElementById('editing-channel-submit').addEventListener('click', () => {  //submit channel-editing
	const new_name = document.getElementById('new-channel-name').value;
	const new_description = document.getElementById('new-channel-description').value;
	apiCallPut2(`channel/${current_channel_id}`, {
		name: new_name,
		description: new_description,
	}, true)
		.then(() => {
			document.getElementById('channel-editing').style.display = 'none';
			document.getElementById('channel-info-popup').style.display = 'none';
			document.getElementById('channel-title-bar-name').textContent = new_name;
			loadDashboard();
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
});



document.getElementById('btn-channel-info-invite').addEventListener('click', () => {	//invite user
	document.getElementById('channel-inviting').style.display = 'block';
	clearChildren(document.getElementById('channel-inviting-users-list'));
	apiCallGet2(`channel/${current_channel_id}`, {}, true)
		.then(body => {
			console.log(body);
			apiCallGet2(`user`, {}, true)
				.then(body2 => {
					console.log(body2);
					body2.users.forEach(user => {
						if (!body.members.includes(user.id)) {
							apiCallGet2(`user/${user.id}`, {}, true)
								.then(body3 => {
									console.log(body3);
									const current_user_checkbox = document.createElement("input");
									current_user_checkbox.setAttribute("type", "checkbox");
									current_user_checkbox.setAttribute("id", `invite_user_${user.id}`);
									current_user_checkbox.setAttribute("name", `user_${user.id}`);
									current_user_checkbox.setAttribute("value", `${user.id}`);
									current_user_checkbox.setAttribute("style", "margin-right: 10px;");
									const current_user_label = document.createElement("label");
									current_user_label.setAttribute("for", `invite_user_${user.id}`);
									current_user_label.innerText = `${body3.name} (${user.id})`;
									const current_user_avatar = document.createElement("img");
									current_user_avatar.setAttribute("class", "message-user-avatar");
									current_user_avatar.setAttribute("src", "./assets/default_avatar.jpg");
									if (body3.image) {
										current_user_avatar.setAttribute("src", body3.image);
									}
									current_user_avatar.setAttribute("style", "width: 30px; height: 30px; border-radius: 50%;");
									const current_user_container = document.createElement("div");
									current_user_container.setAttribute("style", "display: flex; flex-direction: row; align-items: center; margin-bottom: 10px;");
									current_user_container.appendChild(current_user_checkbox);
									current_user_container.appendChild(current_user_avatar);
									current_user_container.appendChild(current_user_label);
									document.getElementById('channel-inviting-users-list').appendChild(current_user_container);
								})
								.catch((msg) => {
									showErrorPopup(msg);
								});

						}
					});
				})
				.catch((msg) => {
					showErrorPopup(msg);
				});
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});

});



document.getElementById('channel-inviting-submit').addEventListener('click', () => {	//invite user submit
	const checkboxes_container = document.getElementById('channel-inviting-users-list');
	const checked_checkboxes = checkboxes_container.querySelectorAll('input[type="checkbox"]:checked');
	const checked_checkboxes_array = Array.from(checked_checkboxes);
	const checked_checkboxes_values = checked_checkboxes_array.map((checkbox) => checkbox.value);
	console.log(checked_checkboxes_values);
	checked_checkboxes_values.forEach(user_id => {
		const int_user_id = parseInt(user_id);
		apiCallPost2(`channel/${current_channel_id}/invite`, {
			userId: int_user_id
		}, true)
			.then(() => {
				console.log(`user ${user_id} invited`);
			})
			.catch((msg) => {
				showErrorPopup(msg);
			});
	});
	document.getElementById('channel-inviting').style.display = 'none';
});




document.getElementById('close-channel-inviting-PopupBtn').addEventListener('click', () => { 
	document.getElementById('channel-inviting').style.display = 'none';
});

document.getElementById('btn-channel-info-join').addEventListener('click', () => {	//join channel
	apiCallPost2(`channel/${current_channel_id}/join`, {}, true)
		.then(() => {
			loadDashboard();
			loadMessages();
			document.getElementById('btn-channel-info-leave').style.display = 'block';
			document.getElementById('btn-channel-info-join').style.display = 'none';
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});

});

document.getElementById('btn-channel-info-leave').addEventListener('click', () => {	//leave channel
	apiCallPost2(`channel/${current_channel_id}/leave`, {}, true)
		.then(() => {
			document.getElementById('channel-screen').style.display = 'none';
			loadDashboard();
			document.getElementById('btn-channel-info-join').style.display = 'block';
			document.getElementById('btn-channel-info-leave').style.display = 'none';
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
});



document.getElementById('btn-channel-info').addEventListener('click', () => {
	apiCallGet2(`channel/${current_channel_id}`, {}, true)
		.then(body => {
			console.log(body);
			document.getElementById('channel-info-name').textContent = body.name;
			document.getElementById('channel-info-id').textContent = current_channel_id;
			document.getElementById('channel-info-creator').textContent = body.creator;
			apiCallGet2(`user/${body.creator}`, {}, true)	//user id to name
				.then(body2 => {
					console.log(body2);
					document.getElementById('channel-info-creator').textContent = body2.name;
				})
				.catch((msg) => {
					showErrorPopup(msg);
				});
			if (body.private === true) {
                document.getElementById('channel-info-isPrivate').textContent = 'private';
			}
			else {
				document.getElementById('channel-info-isPrivate').textContent = 'public';
            }
			document.getElementById('channel-info-created-time').textContent = new Date(body.createdAt).toLocaleDateString();
			document.getElementById('channel-info-description').textContent = body.description;
			document.getElementById('channel-info-members-list').textContent = body.members;
			document.getElementById('channel-info-popup').style.display = 'block';
		})
		.catch ((msg) => {
			showErrorPopup(msg);
        });
});

document.getElementById('close-channel-info-PopupBtn').addEventListener('click', () => { //close channel-info popup
	document.getElementById('channel-info-popup').style.display = 'none';
});

let globalUserName = null;
let globalUserEmail = null;
let globalUserDescription = null;
let globalUserAvatar = null;



const showPage = (pageName) => {
	for (const page of document.querySelectorAll('.page-block')) {
		page.style.display = 'none';
	}
	document.getElementById(`page-${pageName}`).style.display = 'block';
	if (pageName === 'dashboard') {
		loadDashboard();
		startPolling();
		apiCallGet2(`user/${globalUserId}`, {}, true)
			.then(body => {
				console.log(body);
				globalUserName = body.name;
				globalUserEmail = body.email;
				globalUserDescription = body.bio;
				if (body.image) {
					globalUserAvatar = body.image;
				}
				else {
					globalUserAvatar = null;
				}
			})
			.catch((msg) => {
				showErrorPopup(msg);
			});
	}
}

document.getElementById('register-submit').addEventListener('click', (e) => { //e Includes all attributes related to the event, but we don't need it here
	const email = document.getElementById('register-email').value;			// actually, we can use e to prevent the default behavior of the event
	const name = document.getElementById('register-name').value;
	const password = document.getElementById('register-password').value;
	const passwordConfirm = document.getElementById('register-password-confirm').value;
	if (password !== passwordConfirm) {
		showErrorPopup('Passwords need to match');
	} else {
		console.log(email, name, password, passwordConfirm);

		apiCallPost2('auth/register', {
			email: email,
			name: name,
			password: password,
		})							//follow the promise returned by apiCallPost2
		.then((body) => {
			const { token, userId } = body;
			globalToken = token;
			globalUserId = userId;
			localStorage.setItem('token', token);
			localStorage.setItem('userid', userId);
			showPage('dashboard');
		})
		.catch((msg) => {
			showErrorPopup(msg); 
		});
	}
});

document.getElementById('login-submit').addEventListener('click', (e) => { //login button
	const email = document.getElementById('login-email').value;
	const password = document.getElementById('login-password').value;

	apiCallPost2('auth/login', {
		email: email,
		password: password,
	})
	.then((body) => {
		const { token, userId } = body;
		globalToken = token;
		globalUserId = userId;
		localStorage.setItem('token', token);
		localStorage.setItem('userid', userId);
		showPage('dashboard');
	})
	.catch((msg) => {
		showErrorPopup(msg);
	});
});

document.getElementById('logout').addEventListener('click', (e) => { //logout button
	clearChildren(document.getElementById('channel-chatroom'));
	stopPolling();
	document.getElementById('channel-screen').style.display = 'none';
	apiCallPost2('auth/logout', {}, true)
		.then(() => {
		localStorage.removeItem('token');
		localStorage.removeItem('userid');
		showPage('register');
	})
	.catch((msg) => {
		showErrorPopup(msg);
	});
});

document.getElementById('closeErrorPopupBtn').addEventListener('click', ()=> { //close error popup
	document.getElementById('errorPopup').style.display = 'none';
});

for (const redirect of document.querySelectorAll('.redirect')) {
	const newPage = redirect.getAttribute('redirect');
	redirect.addEventListener('click', () => {
		showPage(newPage);
	});
}

//check if user is already logged in
const localStorageToken = localStorage.getItem('token');
const localStorageUserId = parseInt(localStorage.getItem('userid'),10);
if (localStorageToken !== null) {
	globalToken = localStorageToken;
}
if (localStorageUserId !== null) {
	globalUserId = localStorageUserId;
}

if (globalToken === null) {  //skip login page if already logged in
	showPage('register');
} else {
	showPage('dashboard');
}


document.getElementById('btn-create-public-channel').addEventListener('click', () => {
	document.getElementById('creating-channel-popup').style.display = 'block';
	document.getElementById('private-check').checked = false;
});

document.getElementById('btn-create-private-channel').addEventListener('click', () => {
	document.getElementById('creating-channel-popup').style.display = 'block';
	document.getElementById('private-check').checked = true;
});

document.getElementById('close-creating-channel-PopupBtn').addEventListener('click', () => { //close channel-creating popup
	document.getElementById('creating-channel-popup').style.display = 'none';
});

document.getElementById('creating-channel-submit').addEventListener('click', () => {
	const name = document.getElementById('channel-name').value;
	const description = document.getElementById('channel-description').value;
	const isPrivate = document.getElementById('private-check').checked;
	apiCallPost2('channel', {
		name: name,
		private: isPrivate,
		description: description,
	}, true)
		.then(() => {
			document.getElementById('creating-channel-popup').style.display = 'none';
			loadDashboard();
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
});

