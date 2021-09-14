gigya.accounts.showScreenSet({
	screenSet: 'Default-RegistrationLogin',
	containerID: 'screenSetContainer'
});

gigya.accounts.addEventHandlers({
	onLogin: (event) => {
		window.location.replace("/saml/proxy");
	}
})