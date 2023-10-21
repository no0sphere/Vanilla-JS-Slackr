import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, apiCallPost, clearChildren } from './helpers.js';

let globalToken = null;
let globalUserId = null;

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
			body.channels.map(channel => {	//load channels
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
					if (channel.members.includes(globalUserId)) {
						document.getElementById('btn-channel-info-leave').style.display = 'block';
						document.getElementById('btn-channel-info-join').style.display = 'none';
					}
					else {
						document.getElementById('btn-channel-info-join').style.display = 'block';
						document.getElementById('btn-channel-info-leave').style.display = 'none';
					}
				});

			});

		});
};

document.getElementById('btn-channel-info-edit').addEventListener('click', () => {	//edit channel info
	document.getElementById('new-channel-name').value = "";
	document.getElementById('new-channel-description').value = "";
	document.getElementById('channel-editing').style.display = 'block';
});

document.getElementById('close-editing-channel-PopupBtn').addEventListener('click', () => { //close channel-editing popup
	document.getElementById('channel-editing').style.display = 'none';
});

document.getElementById('editing-channel-submit').addEventListener('click', () => {  //edit channel info
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

