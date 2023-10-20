import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, apiCallPost } from './helpers.js';

let globalToken = null;
let globalUserId = null;

function showErrorPopup(message) {	//take place of alert
	document.getElementById('errorMessage').textContent = message;
	document.getElementById('errorPopup').style.display = 'block';
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
				reject('Error!');
			} else {
				resolve(body);
			}
		});
	});
}

const loadDashboard = () => {
	apiCallGet2('channel', {}, true)
		.then(body => {
			console.log('channels', body);
			
		});
};

const showPage = (pageName) => {
	for (const page of document.querySelectorAll('.page-block')) {
		page.style.display = 'none';
	}
	document.getElementById(`page-${pageName}`).style.display = 'block';
	if (pageName === 'dashboard') {
		loadDashboard();
	}
}
const apiCallPost2 = (path, body, authed=false) => {
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
				callbackError('Error!');
			} else {
				callbackSuccess(body);
			}
		});
	});
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
			localStorage.setItem('userid', userid);
			showPage('dashboard');
		})
		.catch((msg) => {
			showErrorPopup(msg); //showErrorPopup doesn't satisfy our requirements
		});
	}
});

document.getElementById('login-submit').addEventListener('click', (e) => {
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
		localStorage.setItem('userid', userid);
		showPage('dashboard');
	})
	.catch((msg) => {
		showErrorPopup(msg);
	});
});

document.getElementById('logout').addEventListener('click', (e) => {
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

const localStorageToken = localStorage.getItem('token');
if (localStorageToken !== null) {
	globalToken = localStorageToken;
}
if (localStorage.getItem('userid') !== null) {
    globalUserId = localStorage.getItem('userid');
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
