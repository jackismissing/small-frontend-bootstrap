'use strict';

class Application {
	constructor() {
		this.init();
	}

	init() {
		console.log('App init');
	}
}

window.Application = new Application();