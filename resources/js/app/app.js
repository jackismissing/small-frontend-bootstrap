'use strict';

class Application() {
	contructor({}) {
		this.init();
	}

	init() {
		console.log('App init');
	}

	window.Application = new Application();
}