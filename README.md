# TVDML

This is library that main goal is to greatly simplify app development for Apple TV using pure Javascript and [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) providing tools to solve problems like:

- Routing
- Templating and updating data
- Event binding
- Detecting "Menu" button presses
- Configuring player for seamless playing

**What else is in the box?**

TVDML tries to be as simple as possible and not include more than it needs to provide functionality for its base features. But yeah we've got something inside:

- [`es6-promise`](https://www.npmjs.com/package/es6-promise) as polyfill for [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) for async data flow.

	> Exposed to user as `TVDML.Promise`

- [`Object.assign()`](https://www.npmjs.com/package/object-assign) ponyfill to cover your data immutability.

- [`virtual-dom`](https://www.npmjs.com/package/virtual-dom) library to provide you easy to use update mechanism. [Patched](https://github.com/Matt-Esch/virtual-dom/compare/master...a-ignatov-parc:tvml) and ready to be used with TVML.

## Getting started

TVDML is shipping as [npm package](https://www.npmjs.com/package/tvdml) and can be installed with npm

```
npm install --save tvdml
```

TVDML is written in ES6 and built using UMD wrapper so it can be used in any of this ways:

```javascript
// Directly from global scope.
App.onLaunch = function() {
	console.log(TVDML);
}

// Or with CommonJS if you are using bundlers like browserify.
var TVDML = require('tvdml');

// Or with ES6 imports.
import * as TVDML from 'tvdml';

// You can use ES6 destructuring if you need only few 
// of the provided features.
import {subscribe, handleRoute, navigate} from 'tvdml';

// Or even require modules from their sources.
import {handleRoute, navigate} from 'tvdml/src/navigation';
```

> Requiring modules from their sources can help you decrease app size if you are using [rollup](http://rollupjs.org/) for your builds.

Despite being written totally in ES6 TVDML is not forcing you to use it. 

But you should agree that this...

```javascript
App.onLaunch = function(options) {
	evaluateScripts([
		options.BASEURL + 'libs/tvdml.js'
	], function(success) {
		if (success) {
			TVDML
				.render(TVDML.jsx(
					'document', 
					null,
					TVDML.jsx(
						'alertTemplate',
						null,
						TVDML.jsx(
							'title',
							null,
							'Hello world'
						)
					)
				))
				.sink();
		}
	});
}
```

Doesn't look as nice as this

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(TVDML.render(
		<document>
			<alertTemplate>
				<title>Hello world</title>
			</alertTemplate>
		</document>
	));
```

So what we need to be able to write code as in second example? Well it's not that simple but this [tvdml-boilerplate](https://github.com/a-ignatov-parc/tvdml-app-boilerplate) repo will shed the light on basic build configuration.

> To be able to properly transform JSX you need to specify JSX pragma for babel runtime. You can do this by adding `/** @jsx TVDML.jsx */` in the beggining of each module.

Well! Now we know how to write apps using ES6 and JSX so let's start from the basic features!

## Routing

tvOS provided great foundation to write apps using [TVML](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/index.html) and [TVJS](https://developer.apple.com/reference/tvmljs). But you need somehow to react on user's activity and map it to UI.

To help you solving this issues TVDML provides navigation module.

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('start'));

TVDML
	.handleRoute('start')
	.pipe(TVDML.render(
		<document>
			<alertTemplate>
				<title>This is initial view</title>
				<description>You can now navigate to another view</description>
				<button onSelect={event => TVDML.navigate('next')}>
					<text>Go to next page</text>
				</button>
			</alertTemplate>
		</document>
	));

TVDML
	.handleRoute('next')
	.pipe(TVDML.render(
		<document>
			<alertTemplate>
				<title>This is next view</title>
				<description>Now you know how to use routes!</description>
			</alertTemplate>
		</document>
	));
```

> This is small example of using navigation and rendering modules to handle routes and present views to user.

Here is complete navigation module's api:

- `TVDML.handleRoute(routeName)` — Creates pipeline for route handling. Only one pipeline can be created for the route. Otherwise it will throw error.

- `TVDML.dismissRoute(routeName)` — Destroy previously created route pipeline. Can destroy only created pipelines. Otherwise it will throw error.

- `TVDML.navigate(routeName[, params][, isRedirect])` — Navigation trigger. Will invoke registered route pipeline with passed params if they are specified. Route pipeline will result in creating new navigation document. if param `isRedirect` is passed then route pipeline will replace current navigation document with new one.

- `TVDML.redirect(routeName[, params])` — Same as `TVDML.navigate(routeName, params, true)`.

```javascript
import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('start', {foo: 'bar'}));

// To create route handler use `handleRoute` method.
TVDML
	.handleRoute('start')
	.pipe(payload => {
		const {
			route,
			redirect,
			navigation,
		} = payload;
		
		console.log(route); // 'start'
		console.log(redirect); // false
		console.log(navigation); // {foo: 'bar'}
	});
	
// `dismissRoute` method will help you destroy route handler.
TVDML.dismissRoute('start');
```

Here is a list of predefined constants for system events:

- `TVDML.event.EXIT`
- `TVDML.event.ERROR`
- `TVDML.event.LAUNCH`
- `TVDML.event.RELOAD`
- `TVDML.event.RESUME`
- `TVDML.event.SUSPEND`

> This events are related to system handlers: `App.onLaunch`, `App.onExit` etc. 

Why you should use this events and not system handler directly? Because handlers can be assigned only once and events can be attached multiple times. But no one force you to use them.

You can add event listeners like this:

```javascript
import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(eventSymbol => console.log('App is launched!'));
	
const suspendEventPipeline = TVDML
	.subscribe(TVDML.event.SUSPEND)
	.pipe(eventSymbol => console.log('App is sent to background'));

// To destroy event pipeline use `unsubscribe` method.
suspendEventPipeline.unsubscribe();
```

> To know more about how pipelines works check section "Pipelines".

Also there are some predefined routes that may help you:

- `TVDML.route.NOT_FOUND` — Will be invoked when navigation module was unable to find match to requested route.

The next big thing is...

## Templating

Using TVDML you have multiple ways to create documents for TVML depending on your need.

> Here is a [list of all possible documents](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/TextboxTemplate.html) you can use in TVML.

## Rendering static document

The simples way to create view:
	
```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
	
TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('start'));
	
TVDML
	.handleRoute('start')
	.pipe(TVDML.render(
		<document>
			<alertTemplate>
				<title>Hello world</title>
				<button>
					<text>Ok</text>
				</button>
			</alertTemplate>
		</document>
	));
```

> TVDML works only with templates created using JSX. Please check how to configure your build to be able to use it in "Getting started" section.

## Rendering custom data using factory approach

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
	
TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => {
		TVDML.navigate('start', {title: 'Hello everybody!'}); // Passing params to route pipeline
	});
	
TVDML
	.handleRoute('start')
	
	// Extracting `title` param from `navigation` object.
	.pipe(({navigation: {title}}) => ({title}))

	// Rendering custom `title`
	.pipe(TVDML.render(({title}) => {
		return (
			<document>
				<alertTemplate>
					<title>{title}</title>
					<button>
						<text>Ok</text>
					</button>
				</alertTemplate>
			</document>
		);
	}));
```
	
Using this approach you can render any data that you need. But you may ask yourself how can we download data from remote server and then render it into document? Easy!

## Downloading and rendering data from remote server

TVDML's pipelines support promises so you can pause it any time you need. For example to retreive any data you need from remove server.

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

// Starting from tvOS 10 TVJS supports ES6 out of the box and there is no need in using 
// Promise polyfill provided by TVDML.
const {Promise} = TVDML;

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('start'));

TVDML
	.handleRoute('start')
	.pipe(downloadTVShows())
	.pipe(TVDML.render(tvshows => {
		return (
			<document>
				<stackTemplate>
					<banner>
						<title>TV Shows</title>
					</banner>
					<collectionList>
						<grid>
							{tvshows.map(tvshow => {
								return (
									<lockup>
										<img src={tvshow.cover} width="250" height="250" />
										<title>{tvshow.title}</title>
									</lockup>
								);
							})}
						</grid>
					</collectionList>
				</stackTemplate>
			</document>
		);
	}));
	
function downloadTVShows() {
	return payload => {
		// Creating and returning promise to pause current pipeline from executing next 
		// step until we load data.
		return new Promise((resolve) => {
			const XHR = new XMLHttpRequest();

			// Configuring XHR instance to load data that we need.
			XHR.open('GET', '/tvshows/all');

			// Adding event listener to retreive data when it will be loaded.
			XHR.addEventListener('load', event => {
				// Parsing request response to JSON and resolving promise
				resolve(JSON.parse(event.target.responseText));
			});

			// Initiating request.
			XHR.send();
		});
	};
}
```

Now lets try to show user some usefull information when he selects tv show

## Events and modals

It's easy to bind event handlers using JSX. All you need to do is add one of the available handlers as attribute on controllable elements.

List of controllable elements:

- `button`
- `lockup`
- `listItemLockup`

List of available handlers:

- `onPlay` — Triggers when "Play" button is pressed.
- `onSelect` — Triggers when Touchpad is pressed.
- `onHighlight` — Triggers when element becoming highlighted.
- `onHoldselect` — Triggers when Touchpad is pressed with a long press.

```javascript
<button onSelect={event => console.log(event.target)}>
	<text>Press Me</text>
</button>
```

The last thing that we need to figure out is how to render modal document. TVDML has `TVDML.renderModal()` method that is similar to `TVDML.render()`. There is also `TVDML.removeModal()` method that removes any presented modal document.

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('start'));

TVDML
	.handleRoute('start')
	.pipe(downloadTVShows())
	.pipe(TVDML.render(tvshows => {
		return (
			<document>
				<stackTemplate>
					<banner>
						<title>TV Shows</title>
					</banner>
					<collectionList>
						<grid>
							{tvshows.map(tvshow => {
								return (
									<lockup onSelect={showTVShowDescription.bind(this, tvshow)}>
										<img src={tvshow.cover} width="250" height="250" />
										<title>{tvshow.title}</title>
									</lockup>
								);
							})}
						</grid>
					</collectionList>
				</stackTemplate>
			</document>
		);
	}));

function showTVShowDescription(tvshow) {
	TVDML
	
		// Creating modal document rendering pipeline.
		.renderModal(
			<document>
				<descriptiveAlertTemplate>
					<title>{tvshow.title}</title>
					<description>{tvshow.description}</description>
				</descriptiveAlertTemplate>
			</document>
		)
		
		// Invoking created pipeline.
		.sink();
}
```

## Working with rendered elements

In some cases you need to work with rendered elements. TVDML provides `ref` mechanism for that.

```javascript
<document>
	<searchTemplate>
		<searchField ref={node => {
			console.log(node.getFeature('Keyboard').text);
		}} />
	</searchTemplate>
</document>
```

That was easy! Right? But how can we update views depending on user activity like loading and rendering more tv shows on "Load more" button press? 

That is a good question and that is where TVDML components comes to the rescue!

## Creating interactive components

I think at least someone has notised that some approaches used in TVDML are similar to those that used is react.js and you will be right! No! There is no react.js inside TVDML but it's hard to argue that its ideas are greatly fit to app development for Apple TV. React.js Components lifecycle are one of them.

`TVDML.createComponent` tries to behave as much as posible as React.js component but with some limitations:

1. There is no need for child components in TVDML so this feature isn't supported. But is a subject to change in future.
1. Rendering mechanism are different from ones used in react.js so interoperability with react components are not tested and most likely not possible.

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('start'));

TVDML
	.handleRoute('start')
	.pipe(downloadTVShows())
	.pipe(TVDML.render(TVDML.createComponent({
		render() {
			return (
				<document>
					<stackTemplate>
						<banner>
							<title>TV Shows</title>
						</banner>
						<collectionList>
							<grid>
								{this.props.tvshows.map(tvshow => {
									return (
										<lockup key={tvshow.id}>
											<img src={tvshow.cover} width="250" height="250" />
											<title>{tvshow.title}</title>
										</lockup>
									);
								})}
							</grid>
						</collectionList>
					</stackTemplate>
				</document>
			);
		},
	})));
```

The last thing that we need to cover is styling elements

## Styling elements

...