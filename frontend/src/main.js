import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, apiCallPost } from './helpers.js';

let globalToken = null;

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
			localStorage.setItem('token', token);
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
		localStorage.setItem('token', token);
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

if (globalToken === null) {
	showPage('register');
} else {
	showPage('dashboard');
}