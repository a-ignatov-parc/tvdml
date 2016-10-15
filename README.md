# TVDML

This is library that main goal is to greatly simplify app development for Apple TV using pure Javascript and [JSX](https://facebook.github.io/react/docs/jsx-in-depth.html) providing tools to solve problems like:

- Routing
- Templating and updating data
- Event binding
- Detecting "Menu" button presses
- Configuring player for seamless playing

**What else is in the box?**

TVDML tries to be as simple as possible and not include more than it needs to provide functionality for its core features. But yeah we've got something inside:

- [`es6-promise`](https://www.npmjs.com/package/es6-promise) as polyfill for [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) for async data flow.

	> Exposed to user as `TVDML.Promise`

- [`Object.assign()`](https://www.npmjs.com/package/object-assign) ponyfill to cover your data immutability.

- [`virtual-dom`](https://www.npmjs.com/package/virtual-dom) library to provide you easy to use update mechanism. [Patched](https://github.com/Matt-Esch/virtual-dom/compare/master...a-ignatov-parc:tvml) and ready to be used with TVML.

## Getting started

TVDML is shipping as [npm package](https://www.npmjs.com/package/tvdml) and can be installed with npm

```
npm install --save tvdml
```

TVDML is written in ES6 and built using UMD wrapper so it can be used in any environment with any of this ways:

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

> This is small example of using navigation and rendering modules to handle routes and show them to user.

Here is a complete api of navigation module:

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

Why would you use this events and not system handlers directly? Handlers can be assigned only once and events can be attached multiple times. But no one force you to use them.

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

## Templating and styling

Using TVDML you have multiple ways to create documents for TVML depending on your need.

> Here is a [list of all possible documents](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/TextboxTemplate.html) you can use in TVML.

### Rendering static document

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

### Rendering custom data using factory approach

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
	
Using this approach you can render any data that you need. But you may ask yourself how can we request data from remote server and then render it into document? 

Easy!

### Requesting and rendering data

TVDML's pipelines support promises so you can pause them when you need it. For example to retreive any data you need from remote server.

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

Now lets figure out how can we react to user activity.

### Events

It's easy to bind event handlers using JSX. All you need to do is add one of the available handlers as attribute on controllable element.

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

### Modals

Modals are perfect when you need to show some useful information but don't want to interupt opened view context. You can use `TVDML.renderModal()` method to render any document you want in overlay. `TVDML.renderModal()` behaviour is similar to `TVDML.render()`. 

There is also `TVDML.removeModal()` method that removes any presented modal document.

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

### Working with rendered elements

TVDML provides you with `ref` mechanism to help with access to rendered document nodes. This is useful when you need to get features of elements like: `textField`, `searchField` and `menuBar`.

```javascript
<document>
	<searchTemplate>
		<searchField ref={node => {
			console.log(node.getFeature('Keyboard').text);
		}} />
	</searchTemplate>
</document>
```

That was easy! Right? But how can we update views depending on user activity? 

That is a good question and that is where TVDML components comes to the rescue!

### Creating interactive components

I think at least someone has notised that some approaches used in TVDML are similar to those that used is react.js and you will be right! No! There is no react.js inside TVDML but it's hard to argue that its ideas are greatly fit to app development for Apple TV. React.js Components lifecycle are one of them.

`TVDML.createComponent` tries to behave as much as posible as React.js component but with some limitations:

1. There is no need for child components in TVDML so this feature isn't supported. But is a subject to change in future.
1. Rendering mechanism are different from ones used in react.js so interoperability with react components are not tested and most likely not possible.

What is not supported from [Component Specs and Lifecycle](https://facebook.github.io/react/docs/component-specs.html):

- `propTypes`
- `mixins`
- `statics`
- `displayName`

Lets see how previous example will look like if it were written using TVDML components:

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

As you can see the main diference is that we need to specify `render` method and `tvshows` are now retrieved from `this.props` object.

> The whole payload passed to `TVDML.render()` will be available as `this.props`.

Now lets implement "Load more" button with pagination and spinner for initial loading.

```javascript
/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('start'));

TVDML
	.handleRoute('start')
	.pipe(TVDML.render(TVDML.createComponent({
		getInitialState() {
			return {
				page: 1,
				tvshows: [],
				loading: true,
			};
		},

		componentDidMount() {
			// Loading initial tv shows list when component is mounted
			downloadTVShows(this.state.page).then(tvshows => {
				this.setState({
					tvshows,
					loading: false,
				});
			});
		},

		render() {
			// Showing spinner while initial data is loading
			if (this.state.loading) {
				return (
					<document>
						<loadingTemplate>
							<activityIndicator />
						</loadingTemplate>
					</document>
				);
			}

			return (
				<document>
					<stackTemplate>
						<banner>
							<title>TV Shows</title>
						</banner>
						<collectionList>
							<grid>
								{this.state.tvshows.map(tvshow => {
									return (
										<lockup key={tvshow.id}>
											<img src={tvshow.cover} width="250" height="250" />
											<title>{tvshow.title}</title>
										</lockup>
									);
								})}
							</grid>
							<separator>
								<button onSelect={this.onLoadNextPage}>
									<text>Load page #{this.state.page + 1}</text>
								</button>
							</separator>
						</collectionList>
					</stackTemplate>
				</document>
			);
		},

		onLoadNextPage() {
			const nextPage = this.state.page + 1;

			// Loading next page and merging new data with existing.
			// Document update will be immediately invoked on state change.
			downloadTVShows(nextPage).then(tvshows => {
				this.setState({
					page: nextPage,
					tvshows: this.state.tvshows.concat(tvshows),
				});
			});
		},
	})));
```

Looks nice! But what can we do with document parts that are need to be reused in other places? Please welcome partials!

### Partials

Partials are elements that can encapsulate complex markup and logic. They can be distinguished by names that starts with capital letters.

```javascript
TVDML.createComponent({
	render() {
		// Showing spinner while initial data is loading
		if (this.state.loading) {
			return <Loader title="Loading..." />;
		}
	},
})
```

So how is `<Loading />` looks from the inside.

```javascript
function Loader({attrs = {}}) {
	let {title} = attrs;

	return (
		<document>
			<loadingTemplate>
				<activityIndicator>
					<title>{title}</title>
				</activityIndicator>
			</loadingTemplate>
		</document>
	);
}
```

Partials will receive `node` object in [UVDOM notation](https://github.com/gcanti/uvdom#uvdom-formal-type-definition) as first argument.

`Loader` partial in our example will receive next object:

```javascript
{
	tag: function Loader() {...},
	attrs: {
		title: 'Loading...'
	}
}
```

Full `node` specification:

```javascript
{
	tag: string | function,
	attrs: {
		key: string,
		...
	},
	events: {
		eventName: function,
		...
	},
	key: string,
	ref: function,
	children: string | node | array<string | node>
}
```

The last thing that we need to cover is how to style elements.

### Styling elements

There is a big [section in TVML documentation](https://developer.apple.com/library/content/documentation/LanguagesUtilities/Conceptual/ATV_Template_Guide/ITMLStyles.html) related to elements styling. And there are two ways you can attach styles to elements.

#### Inline styles

You can write styles directly on elements using `style` attribute.

```javascript
<title style="tv-text-highlight-style: marquee-on-highlight; color: rgb(84, 82, 80)">
	Hello world
</title>
```

If you need to set multiple of styles on one element you can use ES6 template literals (template strings) in JSX.

```javascript
<textBadge
	type="fill"
	style={`
		font-size: 20;
		border-radius: 30;
		margin: 0 10 12 0;
		padding: 1 8;
		tv-align: right;
		tv-position: bottom;
		tv-tint-color: rgb(255, 255, 255);
	`}
>{counter}</textBadge>
```

#### Document styles and class names

If you have repeated styles or want to keep all styles in one place then you should use document styles. They are must be defined in `<style />` tag inside document's `<head />`.

```javascript
<document>
	<head>
		<style content={`
			.controls_container {
				margin: 40 0 0;
				tv-align: center;
				tv-content-align: top;
			}

			.control {
				margin: 0 24;
			}

			.item {
				background-color: rgba(255, 255, 255, 0.05);
				tv-highlight-color: rgba(255, 255, 255, 0.9);
			}

			.item--disabled {
				color: rgba(0, 0, 0, 0.3);
			}

			.title {
				tv-text-highlight-style: marquee-on-highlight;
			}
		`} />
	</head>
	<compilationTemplate>
		...
	</compilationTemplate>
<document>
```

> `style` tag is TVDML's predefined partial.

After defining class names you can attach them to elements using `class` attribute.

```javascript
<buttonLockup class="control">
	<badge src="resource://button-remove" />
	<title>Mark as Unwatched</title>
</buttonLockup>

<listItemLockup class="item item--disabled">
	<ordinal minLength="3">
		{episodeNumber}
	</ordinal>
	<title class="title">
		{episode.title}
	</title>
	<decorationLabel>
		{dateTitle}
	</decorationLabel>
</listItemLockup>
```

### Complete rendering module api

- `TVDML.render(template)` — Main rendering factory that transforms JSX templates to TVML documents and responsible for rendering them to screen. Uses `TVDML.parseDocument` to parse and evaluate `template` object into TVML document before applying to `NavigationDocument`.

- `TVDML.parseDocument(template)` — Responsible for transforming JSX templates to TVML documents. In most cases you are not supposed to use this method.

  `template` can be:

  - JSX template.
  - function that will return JSX template on execution.

  > String templates are prohibited to use.

- `TVDML.renderModal(template)` — Same as `TVDML.render(template)` but will render passed document in modal overlay.

- `TVDML.removeModal()` — Removes any rendered modals.

- `TVDML.createComponent(spec)` — You should provide a specification object that contains at least `render` method and can optionaly contains other lifecycle methods described [here](https://facebook.github.io/react/docs/component-specs.html). Please check for differences with react.js specification in [Creating interactive components](#creating-interactive-components) section.

- `TVDML.jsx` — Transforms virtual DOM elements from JSX notation into [hyperscript](https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript) notation.

