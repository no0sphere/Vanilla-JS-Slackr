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

let current_channel_id = null;
let current_channel_members = {};
let current_channel_messages_count = 0;



document.getElementById('channel-chatroom').addEventListener('scroll', () => {
	const chatroom_scroll = document.getElementById('channel-chatroom');
	if (chatroom_scroll.scrollTop <= 0) { // 5px from the top
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
				const current_message_content_text = document.createElement("p");
				current_message_content_text.setAttribute("class", "message-text");
				current_message_content_text.innerText = message.message;
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

				if (message.sender === globalUserId) {
					current_message_content.setAttribute("style", "background-color: #e6e6e6; border-radius: 10px; padding: 10px; margin-left: 20px; margin-right: 20px; margin-top: 10px; margin-bottom: 10px; color: green;");
				}

				if (message.sender in current_channel_members) {  //Change sender id to name
					message_content_sender_name.innerText = current_channel_members[message.sender];
				}
				const message_content_sender_avatar = document.createElement("img");
				message_content_sender_avatar.setAttribute("class", "message-user-avatar");
				message_content_sender_avatar.setAttribute("src", "./assets/default_avatar.jpg");
				message_content_sender_avatar.setAttribute("style", "width: 30px; height: 30px; border-radius: 50%;");

				if (message.image) {
					message_content_sender_avatar.setAttribute("src", message.image);
				};
				current_message_content.appendChild(message_content_sender);
				message_content_sender.appendChild(message_content_sender_avatar);
				message_content_sender.appendChild(message_content_sender_name);
				message_content_sender.appendChild(current_message_content_time);
				current_message_content.appendChild(current_message_content_text);
				current_message.appendChild(current_message_content);
				insertAsFirstChild(message_list, current_message);
			});
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});


}

const loadMessages = () => {
	return apiCallGet2(`message/${current_channel_id}?start=0`, {}, true) //load messages
		.then(body => {
			console.log(body);
			document.getElementById('message-input-bar').style.display = 'block';
			const message_list = document.getElementById("channel-chatroom");
			clearChildren(message_list);
			current_channel_messages_count = 0; 
			body.messages.forEach(message => {
				current_channel_messages_count += 1;
				const current_message = document.createElement("div");
				current_message.setAttribute("class", "message");
				const current_message_content = document.createElement("div");
				current_message_content.setAttribute("class", "message-content");
				const current_message_content_text = document.createElement("p");
				current_message_content_text.setAttribute("class", "message-text");
				current_message_content_text.innerText = message.message;
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

				if (message.sender === globalUserId) {
					current_message_content.setAttribute("style", "background-color: #e6e6e6; border-radius: 10px; padding: 10px; margin-left: 20px; margin-right: 20px; margin-top: 10px; margin-bottom: 10px; color: green;");
				}

				if (message.sender in current_channel_members) {  //Change sender id to name
					message_content_sender_name.innerText = current_channel_members[message.sender];
				}
				const message_content_sender_avatar = document.createElement("img");
				message_content_sender_avatar.setAttribute("class", "message-user-avatar");
				message_content_sender_avatar.setAttribute("src", "./assets/default_avatar.jpg");
				message_content_sender_avatar.setAttribute("style", "width: 30px; height: 30px; border-radius: 50%;");

				if (message.image) {
					message_content_sender_avatar.setAttribute("src", message.image);
				};
				current_message_content.appendChild(message_content_sender);
				message_content_sender.appendChild(message_content_sender_avatar);
				message_content_sender.appendChild(message_content_sender_name);
				message_content_sender.appendChild(current_message_content_time);
				current_message_content.appendChild(current_message_content_text);
				current_message.appendChild(current_message_content);
				insertAsFirstChild(message_list, current_message);
			});
			document.getElementById('channel-chatroom').scrollTop = document.getElementById('channel-chatroom').scrollHeight;
		})
		.catch((msg) => {
			showErrorPopup(msg);
		});
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
				current_channel.innerText = channel.name;
				if (channel.private) {
					if (channel.members.includes(globalUserId)) {
						current_channel.setAttribute("class", "private-channel list-group-item list-group-item-action");
						private_channel_list.appendChild(current_channel);
					} 
				}
				else {
					current_channel.setAttribute("class", "public-channel list-group-item list-group-item-action");
					public_channel_list.appendChild(current_channel);
					
				}
				current_channel.addEventListener('click', () => { //check if user is in the channel
					document.getElementById('channel-screen').style.display = 'block';
					document.getElementById('channel-title-bar-name').textContent = channel.name;
					current_channel_id = channel.id;
					if (channel.members.includes(globalUserId)) {  // load messages if user is in the channel
						document.getElementById('btn-channel-info-leave').style.display = 'block';
						document.getElementById('btn-channel-info-join').style.display = 'none';

						for (const member of channel.members) {		//load members
							apiCallGet2(`user/${member}`, {}, true)
								.then(member_body => {
									console.log(member_body);
									current_channel_members[parseInt(member)] = `${member_body.name} (${member})`
									console.log(current_channel_members);
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



document.getElementById('btn-channel-info-join').addEventListener('click', () => {	//join channel
	apiCallPost2(`channel/${current_channel_id}/join`, {}, true)
		.then(() => {
			loadDashboard();
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

const showPage = (pageName) => {
	for (const page of document.querySelectorAll('.page-block')) {
		page.style.display = 'none';
	}
	document.getElementById(`page-${pageName}`).style.display = 'block';
	if (pageName === 'dashboard') {
		loadDashboard();
	}
}

document.getElementById('register-submit').addEventListener('click', (e) => { //e Includes all attributes related to the event, but we don't need it here
	const email = document.getElementById('register-email').value;
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


document.getElementById('btn-create-channel').addEventListener('click', () => {
	document.getElementById('creating-channel-popup').style.display = 'block';
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

